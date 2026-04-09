import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ClipboardCheck, Loader2 } from 'lucide-react';
import { getInquiryById } from '../../api/partners';
import { fetchSiteAssessmentByInquiryId, upsertSiteAssessment } from '../../api/maintenanceApi';
import { toast } from 'react-hot-toast';

const SiteAssessmentFormPage = () => {
    const { id: inquiryId, itemId } = useParams();
    const navigate = useNavigate();
    const [inquiry, setInquiry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [observations, setObservations] = useState('');
    const [requiredServices, setRequiredServices] = useState('');
    const [additionalNotes, setAdditionalNotes] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [inq, existing] = await Promise.all([
                    getInquiryById(inquiryId),
                    fetchSiteAssessmentByInquiryId(inquiryId).catch(() => null)
                ]);
                setInquiry(inq);
                if (existing) {
                    setObservations(existing.observations || '');
                    setRequiredServices(existing.required_services || '');
                    setAdditionalNotes(existing.additional_notes || '');
                }
            } catch (e) {
                console.error(e);
                toast.error('Failed to load inquiry');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [inquiryId]);

    const customer = inquiry?.customers || {};
    const businessName = customer.business_name || '—';
    const inquiryNo = inquiry?.inquiry_no || inquiryId;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await upsertSiteAssessment({
                inquiryId,
                observations,
                requiredServices,
                additionalNotes
            });
            toast.success('Assessment saved');
            navigate(`/partner/inquiry/${inquiryId}/item/${itemId}`);
        } catch (err) {
            console.error(err);
            toast.error(err?.message || 'Failed to save assessment');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-500" size={40} />
            </div>
        );
    }

    if (!inquiry) {
        return (
            <div className="p-12 text-center">
                <p className="text-slate-600 font-bold mb-4">Inquiry not found</p>
                <Link to="/partner/dashboard" className="text-primary-600 font-bold underline">
                    Back to dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 max-w-4xl mx-auto animate-in fade-in duration-500">
            <Link
                to={`/partner/inquiry/${inquiryId}/item/${itemId}`}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-8 transition-colors"
            >
                <ChevronLeft size={20} />
                Back to details
            </Link>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft-xl p-8 md:p-10">
                <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight mb-2">Site Assessment Form</h1>
                <p className="text-slate-500 text-sm mb-10">
                    Please fill in the technical findings for <span className="font-semibold text-slate-700">{businessName}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                Customer name
                            </label>
                            <input
                                type="text"
                                readOnly
                                value={businessName}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-800 font-semibold cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                Inquiry number
                            </label>
                            <input
                                type="text"
                                readOnly
                                value={inquiryNo}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-800 font-semibold cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Observations
                        </label>
                        <textarea
                            required
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            rows={5}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-y min-h-[120px] placeholder:text-slate-400"
                            placeholder="Technical observations on site..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Required services
                        </label>
                        <textarea
                            required
                            value={requiredServices}
                            onChange={(e) => setRequiredServices(e.target.value)}
                            rows={5}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-y min-h-[120px] placeholder:text-slate-400"
                            placeholder="List required parts/services..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Additional notes
                        </label>
                        <input
                            type="text"
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                            placeholder="Optional"
                        />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => navigate(`/partner/inquiry/${inquiryId}/item/${itemId}`)}
                            className="sm:mr-auto text-sm font-bold text-primary-600 hover:text-primary-700 py-3 px-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-black py-4 px-8 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <ClipboardCheck size={20} />}
                            Complete assessment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SiteAssessmentFormPage;
