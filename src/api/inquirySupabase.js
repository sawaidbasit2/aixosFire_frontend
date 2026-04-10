import { supabase } from '../supabaseClient';

/**
 * Insert inquiry + items directly into Supabase when the REST API is unreachable.
 * Keeps agent visit flow working on Vercel when VITE_API_URL / CORS / backend SSL fails.
 */
export async function createInquiryViaSupabase(inquiryData, items) {
  if (!inquiryData?.customer_id || !inquiryData?.inquiry_no || !inquiryData?.type) {
    throw new Error('createInquiryViaSupabase: missing inquiry_no, customer_id, or type');
  }

  const inquiryRow = {
    inquiry_no: inquiryData.inquiry_no,
    customer_id: inquiryData.customer_id,
    type: inquiryData.type,
    priority: inquiryData.priority || 'Medium',
    status: inquiryData.status || 'pending',
  };

  const optionalInquiryKeys = [
    'partner_id',
    'agent_id',
    'visit_id',
    'performed_by',
    'follow_up_date',
    'follow_up_history',
    'qr_code_value',
    'internal_reference_number',
    'notes',
    'preferred_date',
  ];

  optionalInquiryKeys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(inquiryData, k)) {
      const v = inquiryData[k];
      if (v !== undefined && v !== null && v !== '') {
        inquiryRow[k] = v;
      } else if (k === 'follow_up_history' && Array.isArray(inquiryData[k])) {
        inquiryRow[k] = inquiryData[k];
      }
    }
  });

  const { data: inq, error: inqErr } = await supabase
    .from('inquiries')
    .insert([inquiryRow])
    .select('id')
    .single();

  if (inqErr) {
    console.error('[createInquiryViaSupabase] inquiries insert', inqErr);
    throw inqErr;
  }

  const inquiryId = inq.id;
  const customerId = inquiryData.customer_id;
  const itemList = Array.isArray(items) ? items : [];

  const itemRows = itemList.map((it) => {
    const row = {
      inquiry_id: inquiryId,
      customer_id: customerId,
      serial_no: it.serial_no ?? 1,
      type: it.type ?? null,
      system_type: it.system_type ?? null,
      capacity: it.capacity ?? null,
      quantity: it.quantity ?? 1,
      price: it.price ?? 0,
      unit: it.unit ?? 'Pieces',
      system: it.system ?? null,
      status: it.status ?? null,
      catalog_no: it.catalog_no ?? null,
      maintenance_notes: it.maintenance_notes ?? null,
      maintenance_voice_url: it.maintenance_voice_url ?? null,
      maintenance_unit_photo_url: it.maintenance_unit_photo_url ?? null,
      extinguisher_photo: it.extinguisher_photo ?? null,
      expiry_date: it.expiry_date ?? null,
      performed_by: it.performed_by ?? null,
      is_sub_unit: it.is_sub_unit ?? false,
      validation_mode: it.validation_mode ?? 'new',
      follow_up_date: it.follow_up_date ?? null,
      follow_up_date_validation: it.follow_up_date_validation ?? null,
    };
    if (it.condition != null) row.condition = it.condition;
    return row;
  });

  if (itemRows.length > 0) {
    const { error: itemsErr } = await supabase.from('inquiry_items').insert(itemRows);
    if (itemsErr) {
      console.error('[createInquiryViaSupabase] inquiry_items insert', itemsErr);
      throw itemsErr;
    }
  }

  return { id: inquiryId, via: 'supabase' };
}
