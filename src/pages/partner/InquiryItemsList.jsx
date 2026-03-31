import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, ArrowLeft, Eye, Building2, Loader2, CheckCircle2 } from 'lucide-react';
import { getInquiryById } from '../../api/partners';
import { acceptInquiry } from '../../api/maintenanceApi';
import PartnerInspectionReportModal from './components/PartnerInspectionReportModal';
import ValidationInquiryDetail from './components/ValidationInquiryDetail';
import RefillInquiryDetail from './components/RefillInquiryDetail';
import { buildValidationInquiryViewModel } from './utils/validationInquiryViewModel';
import { buildRefillInquiryViewModel } from './utils/refillInquiryViewModel';
import { toast } from 'react-hot-toast';

const getInquiryTypeKey = (inquiry) =>
    (inquiry?.type || inquiry?.inquiry_type || '').toString().trim().toLowerCase();

const isRefillInquiryType = (key) => key === 'refill' || key === 'refilled';

const InquiryItemsList = () => {
    const { id } = useParams();
    const [inquiry, setInquiry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const fetchInquiry = async () => {
        setLoading(true);
        try {
            const data = await getInquiryById(id);
            if (import.meta.env.DEV) {
                console.debug('[Partner InquiryItemsList] GET /inquiries/:id', { id, data });
            }
            setInquiry(data);
            setError('');
        } catch (err) {
            console.error('Error fetching inquiry:', err);
            setError('Failed to load inquiry details. Please try again.');
            toast.error('Failed to load inquiry details');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        try {
            setLoading(true);
            await acceptInquiry(id);
            toast.success('Inquiry accepted successfully');
            await fetchInquiry();
        } catch (err) {
            console.error('Error accepting inquiry:', err);
            toast.error('Failed to accept inquiry');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiry();
    }, [id]);

    const inquiryTypeKey = inquiry ? getInquiryTypeKey(inquiry) : '';
    const isValidation = inquiryTypeKey === 'validation';
    const isRefill = isRefillInquiryType(inquiryTypeKey);

    const validationViewModel = useMemo(() => {
        if (!inquiry || !isValidation) return null;
        return buildValidationInquiryViewModel(inquiry);
    }, [inquiry, isValidation]);

    const refillViewModel = useMemo(() => {
        if (!inquiry || !isRefill) return null;
        const vm = buildRefillInquiryViewModel(inquiry);
        if (import.meta.env.DEV) {
            console.debug('[Partner InquiryItemsList] Refill view model', { inquiryTypeKey, vm });
        }
        return vm;
    }, [inquiry, isRefill, inquiryTypeKey]);

    if (loading) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <Loader2 className="animate-spin text-primary-500" size={40} />
        </div>
    );

    if (error) return (
        <div className="p-12 text-center">
            <p className="text-red-600 font-bold uppercase tracking-widest">{error}</p>
            <button onClick={fetchInquiry} className="text-primary-500 font-bold mt-4 inline-block underline">Retry</button>
        </div>
    );

    if (!inquiry) return (
        <div className="p-12 text-center">
            <p className="text-slate-500 font-bold uppercase tracking-widest">Inquiry not found</p>
            <Link to="/partner/dashboard" className="text-primary-500 font-bold mt-4 inline-block underline">Back to Dashboard</Link>
        </div>
    );

    return (
        <div className="min-h-screen pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="mb-10 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <Link to="/partner/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest mb-4 transition-colors">
                        <ArrowLeft size={16} /> Back to Inquiries
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tighter uppercase italic">
                        {isValidation ? (
                            <>Validation <span className="text-primary-500">Inquiry.</span></>
                        ) : isRefill ? (
                            <>Refill <span className="text-primary-500">Inquiry.</span></>
                        ) : (
                            <>Inquiry <span className="text-primary-500">Items.</span></>
                        )}
                    </h1>
                    <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-600 font-bold text-xs uppercase tracking-wider">
                            <Building2 size={14} className="text-primary-500" /> {inquiry.customers?.business_name || 'Generic Client'}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-600 font-bold text-xs uppercase tracking-wider">
                            <Package size={14} className="text-primary-500" /> {inquiry.inquiry_no}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {inquiry.status?.toLowerCase() === 'pending' && (
                        <button
                            type="button"
                            onClick={handleAccept}
                            disabled={loading}
                            className="px-8 py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                            Accept Inquiry
                        </button>
                    )}

                    {(inquiry.status?.toLowerCase() === 'pending' || inquiry.status?.toLowerCase() === 'accepted') &&
                        (inquiry.inquiry_type?.toLowerCase() === 'maintenance' ||
                            inquiry.inquiry_type?.toLowerCase() === 'validation') && (
                            <button
                                type="button"
                                onClick={() => setIsUploadModalOpen(true)}
                                className="px-8 py-3 bg-primary-500 text-white hover:bg-primary-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-primary-200"
                            >
                                <Eye size={18} /> Upload Report
                            </button>
                        )}
                </div>
            </div>

            {isValidation && validationViewModel ? (
                <ValidationInquiryDetail viewModel={validationViewModel} />
            ) : isRefill && refillViewModel ? (
                <RefillInquiryDetail viewModel={refillViewModel} />
            ) : (
                <>
                    {/* Items Table — non-Validation inquiries only */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-1000">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/50">
                                        <th className="px-8 py-6">Product</th>
                                        <th className="px-8 py-6">Description</th>
                                        <th className="px-8 py-6">Unit</th>
                                        <th className="px-8 py-6">Unit Price</th>
                                        <th className="px-8 py-6">Quantity</th>
                                        <th className="px-8 py-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(inquiry.inquiry_items || []).length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                                No data available
                                            </td>
                                        </tr>
                                    )}
                                    {(inquiry.inquiry_items || []).map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 tracking-tight leading-none">{item.type || item.firefighting_system || 'Fire Equipment'}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 italic">Safety Equipment</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-medium text-slate-500 italic">{item.system_type || item.maintenance_notes || '--'}</span>
                                            </td>
                                            <td className="px-8 py-6 font-bold text-slate-700">{item.unit || 'Pieces'}</td>
                                            <td className="px-8 py-6 font-black text-primary-600 text-lg tracking-tighter">${item.price || 0}</td>
                                            <td className="px-8 py-6">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-900 border border-slate-100">
                                                    {item.quantity}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link
                                                    to={`/partner/inquiry/${id}/item/${item.id}`}
                                                    className="inline-block px-6 py-2.5 bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm group-hover:shadow-md active:scale-95"
                                                >
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </>
            )}

            <PartnerInspectionReportModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                inquiryId={id}
                inquiryNo={inquiry.inquiry_no}
                onSuccess={() => {
                    fetchInquiry();
                    setIsUploadModalOpen(false);
                }}
            />
        </div>
    );
};

export default InquiryItemsList;
