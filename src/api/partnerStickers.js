import { supabase } from '../supabaseClient';

/**
 * Sticker pool (partners.stickers_total) and usage count (sticker_usage_logs rows).
 * Expects logged-in partner's `user.id` to match `partners.id` (same pattern as agent visits).
 */
export async function fetchPartnerStickerSummary(partnerId) {
  if (!partnerId) {
    return { stickersTotal: 0, stickersUsed: 0 };
  }

  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('stickers_total')
    .eq('id', partnerId)
    .maybeSingle();

  if (partnerError) {
    console.error('fetchPartnerStickerSummary partner row:', partnerError);
  }

  const { count, error: countError } = await supabase
    .from('sticker_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('partner_id', partnerId);

  if (countError) {
    console.error('fetchPartnerStickerSummary count:', countError);
  }

  return {
    stickersTotal: Number(partner?.stickers_total ?? 0) || 0,
    stickersUsed: count ?? 0,
  };
}

const STICKER_LOG_SELECT = `
  id,
  used_at,
  service_type,
  customer_id,
  inquiry_item_id,
  customers ( business_name ),
  inquiry_items (
    inquiry_id,
    inquiries ( id, inquiry_no )
  )
`;

export async function fetchPartnerStickerUsageLogs(partnerId) {
  if (!partnerId) {
    return [];
  }

  const { data, error } = await supabase
    .from('sticker_usage_logs')
    .select(STICKER_LOG_SELECT)
    .eq('partner_id', partnerId)
    .order('used_at', { ascending: false });

  if (error) {
    console.error('fetchPartnerStickerUsageLogs:', error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

/** @param {string} serviceType db value: validation | refilled */
export function formatStickerServiceLabel(serviceType) {
  const s = (serviceType || '').toLowerCase();
  if (s === 'validation') return 'Validation';
  if (s === 'refilled') return 'Refilled';
  return serviceType || '—';
}

export function stickerLogRowDisplay(row) {
  const customerName = row?.customers?.business_name ?? '—';
  const inquiriesRel = row?.inquiry_items?.inquiries;
  const inquiryNo = inquiriesRel?.inquiry_no ?? inquiriesRel?.id ?? row?.inquiry_items?.inquiry_id ?? '—';
  return {
    id: row.id,
    customerName,
    serviceLabel: formatStickerServiceLabel(row.service_type),
    inquiryDisplay: inquiryNo,
    usedAt: row.used_at,
    service_type: row.service_type,
  };
}
