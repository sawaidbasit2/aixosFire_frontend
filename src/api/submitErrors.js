/** True when the HTTP client never got a response (Safari often: TypeError: Load failed). */
export function isInquiryApiNetworkFailure(error) {
    const msg = error?.message ?? String(error);
    const code = error?.code;
    const isAxios = error?.isAxiosError === true;
    const noResponse = isAxios && !error.response;
    const combined = [msg, error?.cause?.message, String(error?.cause ?? '')].filter(Boolean).join(' ');

    return (
        msg.includes('Load failed') ||
        combined.includes('Load failed') ||
        msg === 'Failed to fetch' ||
        msg === 'Network Error' ||
        code === 'ERR_NETWORK' ||
        code === 'ECONNABORTED' ||
        noResponse
    );
}

/**
 * User-facing message for visit / inquiry submit failures (incl. Safari "Load failed").
 */
export function getVisitSubmitErrorMessage(error, apiConfigured) {
    const msg = error?.message ?? String(error);
    const looksLikeNetwork = isInquiryApiNetworkFailure(error);

    if (looksLikeNetwork) {
        if (!apiConfigured) {
            return (
                'Cannot reach the API: VITE_API_URL is not set for this deployment. ' +
                'In Vercel: Project → Settings → Environment Variables → add VITE_API_URL = https://your-backend-host.com (HTTPS), then redeploy. ' +
                'The value should be your API server origin; /api is added automatically.'
            );
        }
        return (
            'Cannot reach the API server. Check HTTPS URL, CORS (allow this site origin), ' +
            'and that the backend is running. Safari "Load failed" usually means the request never reached the server.'
        );
    }

    return msg || 'Something went wrong while submitting.';
}
