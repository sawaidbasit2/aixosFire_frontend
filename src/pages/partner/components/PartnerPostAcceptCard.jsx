import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ClipboardCheck, Upload } from 'lucide-react';

/**
 * Shown after a maintenance inquiry is accepted — matches “Inquiry accepted” next-step UI.
 */
const PartnerPostAcceptCard = ({ inquiryId, itemId, onUploadReport }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft-xl p-8 w-full xl:w-[340px] shrink-0 xl:sticky xl:top-6">
            <div className="text-center space-y-2 mb-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200">
                    <CheckCircle size={32} strokeWidth={2.5} />
                </div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight font-display">Inquiry accepted</h4>
                <p className="text-sm text-slate-500 leading-relaxed px-1">
                    Choose how you want to proceed with the technical documentation.
                </p>
            </div>

            <button
                type="button"
                onClick={() => navigate(`/partner/inquiry/${inquiryId}/item/${itemId}/site-assessment`)}
                className="w-full bg-white hover:bg-red-50/30 border-2 border-primary-500 text-primary-600 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest mb-4"
            >
                <ClipboardCheck size={22} className="shrink-0" />
                Start site assessment
            </button>

            <div className="flex items-center gap-4 my-5">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Or</span>
                <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
                type="button"
                onClick={onUploadReport}
                className="w-full bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/25 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
            >
                <Upload size={22} className="shrink-0" />
                Upload inspection report
            </button>
        </div>
    );
};

export default PartnerPostAcceptCard;
