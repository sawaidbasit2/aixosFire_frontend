import React, { useState } from 'react';
import { Upload, X, FileText, Calendar, Type, Loader2 } from 'lucide-react';
import { uploadInspectionReportFile } from '../../../api/maintenanceApi';
import { toast } from 'react-hot-toast';

/**
 * Upload inspection report → Supabase Storage + inspection_reports row (real data).
 */
const PartnerInspectionReportModal = ({ isOpen, onClose, inquiryId, inquiryNo, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        file: null
    });
    const [isUploading, setIsUploading] = useState(false);
    const [fileError, setFileError] = useState('');

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowed = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            if (!allowed.includes(file.type)) {
                setFileError('Only PDF and Excel (.xlsx) files are allowed.');
                setFormData({ ...formData, file: null });
            } else {
                setFileError('');
                setFormData({ ...formData, file });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.file) {
            setFileError('Please select a file to upload.');
            return;
        }
        if (!formData.title.trim()) {
            toast.error('Report title is required');
            return;
        }

        setIsUploading(true);
        try {
            await uploadInspectionReportFile({
                inquiryId,
                reportTitle: formData.title.trim(),
                inspectionDate: formData.date,
                notes: formData.notes,
                file: formData.file
            });
            toast.success('Report submitted successfully');
            onSuccess?.();
            onClose();
            setFormData({
                title: '',
                date: new Date().toISOString().split('T')[0],
                notes: '',
                file: null
            });
        } catch (err) {
            console.error(err);
            toast.error(err?.message || 'Failed to submit report');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-start gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upload Inspection Report</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Inquiry: {inquiryNo || inquiryId}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Report title
                        </label>
                        <div className="relative">
                            <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Site Inspection Report - Q1"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Inspection date
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Notes (optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all min-h-[100px] resize-y placeholder:text-slate-400"
                            placeholder="Add any specific findings or comments..."
                            rows={4}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Upload file (PDF or Excel)
                        </label>
                        <div
                            className={`group relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer text-center ${
                                fileError ? 'border-red-200 bg-red-50/30' : 'border-slate-200 hover:border-primary-400 hover:bg-primary-50/20'
                            }`}
                        >
                            {formData.file ? (
                                <div className="flex flex-col items-center">
                                    <FileText className="text-primary-500 mb-2" size={32} />
                                    <p className="text-sm font-bold text-slate-900">{formData.file.name}</p>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFormData({ ...formData, file: null });
                                        }}
                                        className="text-xs text-red-500 mt-2 font-bold hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload
                                        className={`mx-auto mb-2 ${fileError ? 'text-red-400' : 'text-slate-400 group-hover:text-primary-500'}`}
                                        size={32}
                                    />
                                    <p className="text-sm font-bold text-slate-600 group-hover:text-primary-600">Click to upload</p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">
                                        Supported: PDF, XLSX
                                    </p>
                                </>
                            )}
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept=".pdf,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                onChange={handleFileChange}
                            />
                        </div>
                        {fileError && (
                            <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-wide">{fileError}</p>
                        )}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-sm font-bold text-slate-500 hover:text-slate-800 py-3 px-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-black py-4 px-8 rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} /> Submitting…
                                </>
                            ) : (
                                <>
                                    <Upload size={18} /> Submit report
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PartnerInspectionReportModal;
