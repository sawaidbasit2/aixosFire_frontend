import React, { useState } from 'react';
import { X, Send, DollarSign, FileText, AlertCircle } from 'lucide-react';

const QuotationModal = ({ isOpen, onClose, inquiry, onSubmit }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ amount, description, inquiryId: inquiry.id });
            onClose();
        } catch (err) {
            console.error('Failed to submit quotation:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 pb-4 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Submit <span className="text-primary-500">Quotation.</span></h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">For {inquiry?.client}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-2xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Amount ($)</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <DollarSign size={18} />
                            </div>
                            <input
                                type="number"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary-500 outline-none transition-all font-bold text-slate-900"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Details</label>
                        <div className="relative">
                            <div className="absolute left-4 top-4 text-slate-400">
                                <FileText size={18} />
                            </div>
                            <textarea
                                required
                                rows="4"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary-500 outline-none transition-all text-sm text-slate-600 font-medium h-32 resize-none"
                                placeholder="Describe the maintenance/refilling services included..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="p-4 bg-primary-50 rounded-2xl flex gap-3">
                        <AlertCircle className="text-primary-500 flex-shrink-0" size={18} />
                        <p className="text-[10px] text-primary-700 font-bold leading-relaxed">
                            Once submitted, this quotation will be sent to the agent for client review. You cannot edit it after submission.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary-500 hover:bg-primary-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary-500/30 transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>Send Quotation</span>
                                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default QuotationModal;
