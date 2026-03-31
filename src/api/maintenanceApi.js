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

export const fetchSiteAssessmentByInquiryId = async (inquiryId) => {
    const response = await client.get(`/site-assessments/${inquiryId}`);
    return extractApiData(response, null);
};

export const upsertSiteAssessment = async ({
    inquiryId,
    observations,
    requiredServices,
    estimatedCost,
    additionalNotes
}) => {
    const response = await client.post('/site-assessments', {
        inquiry_id: inquiryId,
        observations: observations ?? '',
        required_services: requiredServices ?? '',
        estimated_cost: estimatedCost,
        additional_notes: additionalNotes || null
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
