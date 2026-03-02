import client from './client';

export const getPartnerDashboard = async () => {
    try {
        const response = await client.get('/partners/dashboard');
        return response.data;
    } catch (error) {
        console.error('Error fetching partner dashboard:', error);
        throw error;
    }
};

export const submitQuotation = async (data) => {
    try {
        const response = await client.post('/partners/quotations', data);
        return response.data;
    } catch (error) {
        console.error('Error submitting quotation:', error);
        throw error;
    }
};

export const submitSiteVisit = async (formData) => {
    try {
        // Use multipart/form-data for file uploads
        const response = await client.post('/partners/site-visits', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error('Error submitting site visit:', error);
        throw error;
    }
};
