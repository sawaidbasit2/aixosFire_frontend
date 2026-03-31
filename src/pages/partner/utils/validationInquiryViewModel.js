/**
 * Maps GET /api/inquiries/:id (and related shapes) into a stable view model for Validation UI.
 * Handles snake_case, nested customers, and common alternates without dummy data.
 */

const formatDate = (value) => {
    if (value == null || value === '') return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toISOString().split('T')[0];
};

const normalizeUtilizationRows = (inquiry) => {
    const raw =
        inquiry.utilization_breakdown ||
        inquiry.sticker_utilization ||
        inquiry.stickerUtilization ||
        inquiry.validation_items ||
        null;

    if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((row) => ({
            type:
                row.extinguisher_type ||
                row.type ||
                row.firefighting_system ||
                '—',
            count: row.quantity ?? row.count ?? 0,
            serialRange:
                row.serial_range ||
                row.serialRange ||
                row.serial_no_range ||
                row.serial_range_label ||
                '—'
        }));
    }

    const items = inquiry.inquiry_items;
    if (Array.isArray(items) && items.length > 0) {
        return items.map((item) => ({
            type: item.type || item.firefighting_system || item.system_type || '—',
            count: item.quantity ?? 0,
            serialRange:
                item.serial_range ||
                item.serial_range_label ||
                item.maintenance_notes ||
                '—'
        }));
    }

    return [];
};

export const buildValidationInquiryViewModel = (inquiry) => {
    if (!inquiry || typeof inquiry !== 'object') {
        return {
            inquiryNo: '—',
            badgeLabel: 'Inquiry',
            clientName: '—',
            location: '—',
            createdDate: '—',
            agentName: '—',
            stickersUsed: 0,
            agentNotes: '',
            status: '—',
            utilizationRows: [],
            customerEmail: null
        };
    }

    const customers = inquiry.customers || {};
    const clientName =
        customers.business_name ||
        inquiry.customer_name ||
        inquiry.client_name ||
        '—';

    const location =
        inquiry.location_address ||
        inquiry.address ||
        customers.address ||
        inquiry.location ||
        '—';

    const agentName =
        inquiry.agent_name ||
        inquiry.assigned_agent_name ||
        (inquiry.agents && (inquiry.agents.name || inquiry.agents.full_name)) ||
        inquiry.agent?.name ||
        '—';

    const stickersRaw =
        inquiry.total_stickers ??
        inquiry.stickers_used ??
        inquiry.stickersUsed ??
        inquiry.total_stickers_used ??
        0;

    const agentNotes =
        inquiry.agent_comments ||
        inquiry.agent_notes ||
        inquiry.notes ||
        inquiry.description ||
        '';

    const inquiryNo = inquiry.inquiry_no || inquiry.inquiryNo || String(inquiry.id || '—');

    const badgeLabel = inquiryNo.startsWith('INQ') || inquiryNo.startsWith('INQUIRY')
        ? inquiryNo
        : `Inquiry ${inquiryNo}`;

    return {
        inquiryNo,
        badgeLabel,
        clientName,
        location,
        createdDate: formatDate(inquiry.created_at || inquiry.createdAt),
        agentName,
        stickersUsed: Number(stickersRaw) || 0,
        agentNotes,
        status: inquiry.status || '—',
        utilizationRows: normalizeUtilizationRows(inquiry),
        customerEmail: customers.email || inquiry.customer_email || null
    };
};
