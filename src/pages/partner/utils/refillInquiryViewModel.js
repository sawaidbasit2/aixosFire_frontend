/**
 * Maps GET /api/inquiries/:id for Refill / Refilled inquiries into UI view model.
 * Supports snake_case, nested objects, and inquiry_items fallbacks — no static business data.
 */

const num = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};

const sumItemQuantities = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((acc, item) => acc + num(item.quantity, 0), 0);
};

export const buildRefillInquiryViewModel = (inquiry) => {
    if (!inquiry || typeof inquiry !== 'object') {
        return {
            inquiryNo: '—',
            customerName: '—',
            totalCylinders: 0,
            fillingChargePerUnit: 0,
            transportChargePerUnit: 0,
            pickupTypeLabel: '—',
            pickupStrategyDescription: '',
            isTransportChargeable: false,
            requirementNote: '',
            customerEmail: null
        };
    }

    const customers = inquiry.customers || {};
    const customerName =
        customers.business_name ||
        inquiry.customer_name ||
        inquiry.client_name ||
        '—';

    const inquiryNo = inquiry.inquiry_no || inquiry.inquiryNo || String(inquiry.id ?? '—');

    const totalCylinders = num(
        inquiry.refill_total_quantity ??
            inquiry.total_cylinders ??
            inquiry.total_quantity ??
            inquiry.cylinder_count,
        sumItemQuantities(inquiry.inquiry_items)
    );

    const pricing = inquiry.refill_pricing || inquiry.pricing || inquiry.price_breakdown || {};
    const fillingChargePerUnit = num(
        pricing.refilling_charge ??
            pricing.filling_charges ??
            pricing.filling_charge_per_unit ??
            inquiry.refilling_charge_per_unit ??
            inquiry.unit_refill_charge,
        num(inquiry.refill_unit_price, 0)
    );

    const transportChargePerUnit = num(
        pricing.transport_charge ??
            pricing.transport_charges ??
            pricing.transport_charge_per_unit ??
            inquiry.transport_charge_per_unit ??
            inquiry.unit_transport_charge,
        0
    );

    const isTransportChargeable =
        typeof inquiry.is_transport_chargeable === 'boolean'
            ? inquiry.is_transport_chargeable
            : typeof inquiry.transport_chargeable === 'boolean'
              ? inquiry.transport_chargeable
              : transportChargePerUnit > 0;

    const pickupRaw =
        inquiry.pickup_type ||
        inquiry.pickup_strategy ||
        inquiry.delivery_method ||
        inquiry.pickup ||
        '';

    const pickupTypeLabel =
        typeof pickupRaw === 'string' && pickupRaw.trim()
            ? pickupRaw.replace(/_/g, ' ')
            : '—';

    const pickupStrategyDescription =
        inquiry.pickup_strategy_description ||
        inquiry.pickup_description ||
        inquiry.refill_pickup_notes ||
        '';

    const requirementNote =
        inquiry.refill_requirement_note ||
        inquiry.partner_requirement_note ||
        (totalCylinders > 0
            ? `Total cylinders requested for this refill: ${totalCylinders}. Adjust accepted quantity below if you cannot fulfill the full amount.`
            : '');

    return {
        inquiryNo,
        customerName,
        totalCylinders: Math.max(0, Math.round(totalCylinders)),
        fillingChargePerUnit,
        transportChargePerUnit,
        pickupTypeLabel,
        pickupStrategyDescription,
        isTransportChargeable,
        requirementNote,
        customerEmail: customers.email || inquiry.customer_email || null
    };
};
