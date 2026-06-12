import { supabase } from '../supabaseClient';
import client from './client';

function isStickerCodeConstraintError(err) {
  const text = `${err?.code || ''} ${err?.message || ''} ${err?.details || ''}`;
  return /23502|sticker_code|violates not-null constraint/i.test(text);
}

function extractApiList(res) {
  const payload = res?.data;
  if (payload && typeof payload === 'object' && 'success' in payload) {
    return Array.isArray(payload.data) ? payload.data : [];
  }
  return Array.isArray(payload) ? payload : [];
}

function isStickerInquiry(inq) {
  const t = (inq?.type || inq?.inquiry_type || '').toLowerCase();
  return t === 'validation' || t === 'refilled';
}

/**
 * Backfills sticker_usage_history for Validation/Refilled inquiries that have no sticker record.
 * Uses the REST API (auth-token filtered) to find inquiries — more reliable than Supabase direct
 * since partner_id in DB may not match user.id in edge cases.
 */
export async function repairMissingStickerRecords(partnerId) {
  if (!partnerId) return;
  try {
    // Use REST API — correctly returns inquiries for the logged-in partner via JWT
    let stickerInquiries = [];
    try {
      const res = await client.get('/inquiries', {});
      stickerInquiries = extractApiList(res).filter(isStickerInquiry);
    } catch {
      // Fallback to direct Supabase if REST API is unreachable
      const { data } = await supabase
        .from('inquiries')
        .select('id, type, created_at')
        .eq('partner_id', partnerId)
        .in('type', ['Validation', 'Refilled']);
      stickerInquiries = data || [];
    }

    if (!stickerInquiries.length) return;

    // Check what's already in the history table
    const { data: existing } = await supabase
      .from('sticker_usage_history')
      .select('inquiry_id')
      .eq('partner_id', partnerId);

    const recorded = new Set((existing || []).map(r => r.inquiry_id).filter(Boolean));
    const missing = stickerInquiries.filter(i => !recorded.has(i.id));

    if (!missing.length) return;

    let insertedCount = 0;
    for (const inq of missing) {
      const row = {
        partner_id: partnerId,
        inquiry_id: inq.id,
        used_for: (inq.type || '').toLowerCase() === 'validation' ? 'validation' : 'refilled',
        quantity: 1,
      };

      let { error: insErr } = await supabase.from('sticker_usage_history').insert([row]);

      // Retry with sticker_code if legacy NOT NULL constraint requires it
      if (insErr && isStickerCodeConstraintError(insErr)) {
        const retry = await supabase.from('sticker_usage_history').insert([
          { ...row, sticker_code: `AUTO-${String(inq.id).slice(0, 8).toUpperCase()}` },
        ]);
        insErr = retry.error;
      }

      if (!insErr) {
        insertedCount++;
      } else {
        console.warn('[repairMissingStickerRecords] insert failed for inquiry', inq.id, insErr.message);
      }
    }

    if (insertedCount > 0) {
      const { data: p } = await supabase
        .from('partners')
        .select('stickers_total')
        .eq('id', partnerId)
        .maybeSingle();

      if (p != null) {
        const newTotal = Math.max(0, (Number(p.stickers_total) || 0) - insertedCount);
        await supabase
          .from('partners')
          .update({ stickers_total: newTotal })
          .eq('id', partnerId);
      }
      console.log(`[repairMissingStickerRecords] backfilled ${insertedCount} sticker record(s)`);
    }
  } catch (err) {
    console.warn('[repairMissingStickerRecords] unexpected error:', err);
  }
}

/**
 * Sticker balance (partners.stickers_total) and usage count from sticker history.
 * Falls back to REST API inquiry count if history table has no records yet.
 */
export async function fetchPartnerStickerSummary(partnerId) {
  if (!partnerId) {
    return { stickersRemaining: 0, stickersUsed: 0, stickersAllocated: 0 };
  }

  const [partnerResult, usedResult] = await Promise.allSettled([
    supabase.from('partners').select('stickers_total').eq('id', partnerId).maybeSingle(),
    supabase.from('sticker_usage_history').select('quantity').eq('partner_id', partnerId),
  ]);

  const partner = partnerResult.status === 'fulfilled' ? partnerResult.value?.data : null;
  const usedRows = usedResult.status === 'fulfilled' ? usedResult.value?.data : [];

  let stickersUsed = Array.isArray(usedRows)
    ? usedRows.reduce((sum, r) => sum + (Number(r?.quantity ?? 0) || 0), 0)
    : 0;

  const stickersRemaining = Number(partner?.stickers_total ?? 0) || 0;

  // If history table has no records yet, count from the REST API as fallback.
  // This covers the case where sticker_usage_history hasn't been backfilled yet.
  if (stickersUsed === 0) {
    try {
      const res = await client.get('/inquiries', {});
      const apiCount = extractApiList(res).filter(isStickerInquiry).length;
      if (apiCount > 0) {
        // Deduction hasn't happened yet — treat remaining as the total allocation
        return {
          stickersRemaining,
          stickersUsed: apiCount,
          stickersAllocated: stickersRemaining,
        };
      }
    } catch {
      // Ignore — return history-based values below
    }
  }

  return {
    stickersRemaining,
    stickersUsed,
    stickersAllocated: stickersUsed + stickersRemaining,
  };
}

const STICKER_LOG_SELECT = `
  id,
  partner_id,
  inquiry_id,
  used_for,
  quantity,
  created_at,
  inquiries (
    id,
    inquiry_no,
    type,
    customers ( business_name )
  )
`;

export async function fetchPartnerStickerUsageLogs(partnerId) {
  if (!partnerId) {
    return [];
  }

  const { data, error } = await supabase
    .from('sticker_usage_history')
    .select(STICKER_LOG_SELECT)
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });

  if (!error && Array.isArray(data) && data.length > 0) {
    return data;
  }

  // Fallback: build virtual log entries from REST API inquiries when history is empty
  try {
    const res = await client.get('/inquiries', {});
    const stickerInqs = extractApiList(res).filter(isStickerInquiry);
    return stickerInqs.map(inq => ({
      id: inq.id,
      partner_id: partnerId,
      inquiry_id: inq.id,
      used_for: (inq.type || '').toLowerCase(),
      quantity: 1,
      created_at: inq.created_at,
      inquiries: {
        id: inq.id,
        inquiry_no: inq.inquiry_no,
        type: inq.type,
        customers: inq.customers || { business_name: inq.customer_name || '—' },
      },
    }));
  } catch (e) {
    console.error('fetchPartnerStickerUsageLogs fallback failed:', e);
    return [];
  }
}

/** @param {string} serviceType db value: validation | refilled */
export function formatStickerServiceLabel(serviceType) {
  const s = (serviceType || '').toLowerCase();
  if (s === 'validation') return 'Validation';
  if (s === 'refilled') return 'Refilled';
  return serviceType || '—';
}

export function stickerLogRowDisplay(row) {
  const inquiry = row?.inquiries;
  const customerName = inquiry?.customers?.business_name ?? '—';
  const inquiryNo = inquiry?.inquiry_no ?? inquiry?.id ?? row?.inquiry_id ?? '—';
  return {
    id: row.id,
    customerName,
    serviceLabel: formatStickerServiceLabel(row.used_for || inquiry?.type),
    inquiryDisplay: inquiryNo,
    quantity: Number(row?.quantity ?? 1) || 1,
    usedAt: row.created_at,
    service_type: (row.used_for || '').toLowerCase(),
  };
}
