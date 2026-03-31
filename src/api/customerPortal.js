import client from './client';

const extractApiData = (response, fallback = null) => {
    const payload = response?.data;
    if (payload && typeof payload === 'object' && 'success' in payload) {
        return payload.success ? (payload.data ?? fallback) : fallback;
    }
    return payload ?? fallback;
};

/**
 * Customer-scoped inquiries (backend should filter by JWT customer role).
 */
export const fetchCustomerInquiries = async () => {
    try {
        const response = await client.get('/inquiries');
        return extractApiData(response, []);
    } catch (e) {
        console.error('fetchCustomerInquiries:', e);
        throw e;
    }
};

/**
 * Quotations visible to the logged-in customer.
 */
export const fetchCustomerQuotations = async () => {
    try {
        const response = await client.get('/quotations');
        return extractApiData(response, []);
    } catch (e) {
        console.error('fetchCustomerQuotations:', e);
        throw e;
    }
};

export const approveQuotation = async (quotationId) => {
    try {
        const response = await client.patch(`/quotations/${quotationId}`, { status: 'approved' });
        return extractApiData(response, null);
    } catch (e) {
        console.error('approveQuotation:', e);
        throw e;
    }
};
