import client from './client';

const extractApiData = (response, fallback = null) => {
    const payload = response?.data;
    if (payload && typeof payload === 'object' && 'success' in payload) {
        return payload.success ? (payload.data ?? fallback) : fallback;
    }
    return payload ?? fallback;
};

/**
 * Partner maintenance documentation — all persistence via Express API (no Supabase in browser).
 */

export const acceptInquiry = async (inquiryId) => {
    const response = await client.patch(`/inquiries/${inquiryId}/accept`);
    return extractApiData(response, null);
};

export const scheduleMaintenanceVisit = async (inquiryId, scheduledDate) => {
    const response = await client.post('/schedule', {
        inquiry_id: inquiryId,
        scheduled_date: scheduledDate
    });
    return extractApiData(response, null);
};

export const approveMaintenanceSchedule = async (inquiryId, status) => {
    const response = await client.patch('/approve', {
        inquiry_id: inquiryId,
        status
    });
    return extractApiData(response, null);
};


export const fetchSiteAssessmentByInquiryId = async (inquiryId) => {
    const response = await client.get(`/site-assessments/${inquiryId}`);
    return extractApiData(response, null);
};

/**
 * POST /api/site-assessments
 * Always send estimated_cost: null so the server does not apply a JS default (e.g. { estimated_cost = 100 } = body).
 * Omitting the key is often interpreted as undefined and falls back to 100 in the API.
 */
export const upsertSiteAssessment = async ({
    inquiryId,
    observations,
    requiredServices,
    additionalNotes
}) => {
    const response = await client.post('/site-assessments', {
        inquiry_id: inquiryId,
        observations: observations ?? '',
        required_services: requiredServices ?? '',
        additional_notes: additionalNotes || null,
        estimated_cost: null
    });
    return extractApiData(response, null);
};

/** GET /inspections/:inquiryId — returns inspection_reports rows */
export const fetchInspectionReportsByInquiryId = async (inquiryId) => {
    const response = await client.get(`/inspections/${inquiryId}`);
    const data = extractApiData(response, []);
    return Array.isArray(data) ? data : [];
};

/** Legacy name used by InquiryItemsList */
export const fetchInspectionsByInquiryId = fetchInspectionReportsByInquiryId;

/**
 * Upload inspection file (multipart) — POST /inspections
 */
export const uploadInspectionReportFile = async ({
    inquiryId,
    reportTitle,
    inspectionDate,
    notes,
    file
}) => {
    if (!file) throw new Error('File is required');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('inquiry_id', inquiryId);
    formData.append('report_title', reportTitle || '');
    formData.append('inspection_date', inspectionDate || '');
    if (notes != null && notes !== '') {
        formData.append('notes', notes);
    }
    const response = await client.post('/inspections', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return extractApiData(response, null);
};

/**
 * Same as uploadInspectionReportFile; accepts alternate field names from InspectionUploadModal.
 */
export const uploadInspectionFile = async ({
    inquiryId,
    title,
    date,
    notes,
    file
}) => {
    return uploadInspectionReportFile({
        inquiryId,
        reportTitle: title,
        inspectionDate: date,
        notes,
        file
    });
};

/**
 * Quotation - POST /api/quotation/create
 */
export const createQuotation = async ({ inquiryId, partnerId, customerId, estimatedCost, file }) => {
    if (!file) throw new Error('PDF file is required');
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('inquiry_id', inquiryId);
    formData.append('partner_id', partnerId);
    formData.append('customer_id', customerId);
    formData.append('estimated_cost', estimatedCost);

    const response = await client.post('/quotation/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return extractApiData(response, null);
};

/** GET /quotation/:inquiryId - returns quotation row */
export const fetchQuotationByInquiryId = async (inquiryId) => {
    const response = await client.get(`/quotations/${inquiryId}`);
    return extractApiData(response, null);
};
