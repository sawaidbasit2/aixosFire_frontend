import React, { useState } from 'react';
import {
    FileText, ChevronLeft, MapPin,
    ClipboardCheck, Send, CheckCircle2,
    XCircle, Upload, DollarSign, User,
    Info, Star
} from 'lucide-react';
import DocumentManagement from './DocumentManagement';

const QuotationModal = ({ isOpen, onClose, inquiry, onSubmit }) => {
    if (!isOpen) return null;

    const [serviceDetails, setServiceDetails] = useState('');
    const [amount, setAmount] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setUploading(true);
        // Simulate upload
        setTimeout(() => {
            onSubmit({ serviceDetails, amount });
            setUploading(false);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Generate Quotation</h2>
                        <p className="text-slate-500 text-sm font-medium">Inquiry: {inquiry?.inquiryNo}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Service Details</label>
                        <textarea
                            required
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="Describe the services to be provided..."
                            rows={3}
                            value={serviceDetails}
                            onChange={(e) => setServiceDetails(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Amount ($)</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Agent Name</label>
                            <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-4 text-slate-500 font-bold flex items-center gap-2">
                                <User size={16} /> Mark Johnson
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Upload Quotation (PDF)</label>
                        <div className="group relative border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:border-primary-500 hover:bg-primary-50/30 transition-all cursor-pointer text-center">
                            <Upload className="mx-auto text-slate-400 group-hover:text-primary-500 mb-2 transition-colors" size={32} />
                            <p className="text-sm font-bold text-slate-600 group-hover:text-primary-600 transition-colors">Click to upload PDF</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">Max size 5MB</p>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf" required />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="flex-1 bg-primary-500 hover:bg-primary-600 shadow-primary flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50"
                        >
                            {uploading ? 'Generating...' : <><Send size={18} /> Submit Quotation</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const MaintenanceTab = ({ data }) => {
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [stage, setStage] = useState('list'); // list, details, assessment, quoted
    const [localData, setLocalData] = useState(data);
    const [isQuotationOpen, setIsQuotationOpen] = useState(false);

    const handleAccept = (id) => {
        setLocalData(prev => prev.map(inq => inq.id === id ? { ...inq, status: 'Accepted' } : inq));
        setSelectedInquiry(prev => ({ ...prev, status: 'Accepted' }));
    };

    const handleReject = (id) => {
        setLocalData(prev => prev.map(inq => inq.id === id ? { ...inq, status: 'Rejected' } : inq));
        setSelectedInquiry(null);
        setStage('list');
    };

    const handleAssessmentSubmit = (id, assessmentData) => {
        setLocalData(prev => prev.map(inq => inq.id === id ? { ...inq, status: 'Assessment Done', assessment: assessmentData } : inq));
        setSelectedInquiry(prev => ({ ...prev, status: 'Assessment Done', assessment: assessmentData }));
        setStage('details');
    };

    const handleQuotationSubmit = (quotationData) => {
        setLocalData(prev => prev.map(inq => inq.id === selectedInquiry.id ? { ...inq, status: 'Quoted', quotation: quotationData } : inq));
        setSelectedInquiry(prev => ({ ...prev, status: 'Quoted', quotation: quotationData }));
        alert("Quotation Submitted Successfully!\n- Customer received PDF & Details\n- Agent received Details Only");
    };

    if (stage === 'assessment') {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                    onClick={() => setStage('details')}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary-500 transition-colors mb-6 font-bold text-sm"
                >
                    <ChevronLeft size={18} /> Back to Details
                </button>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-emerald-50/30">
                        <h2 className="text-2xl font-black text-slate-900">Site Assessment Form</h2>
                        <p className="text-slate-500 font-medium">Please fill in the technical findings for {selectedInquiry.customerName}</p>
                    </div>

                    <form
                        className="p-8 space-y-8"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleAssessmentSubmit(selectedInquiry.id, Object.fromEntries(formData));
                        }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Customer Name</label>
                                <input readOnly value={selectedInquiry.customerName} className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-4 text-slate-500 font-bold cursor-not-allowed outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Inquiry Number</label>
                                <input readOnly value={selectedInquiry.inquiryNo} className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-4 text-slate-500 font-bold cursor-not-allowed outline-none" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Observations</label>
                                <textarea name="observations" required rows={3} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Technical observations on site..."></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Required Services</label>
                                <textarea name="requiredServices" required rows={2} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="List required parts/services..."></textarea>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Estimated Cost ($)</label>
                                    <input name="cost" type="number" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Additional Notes</label>
                                    <input name="notes" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-6">
                            <button type="button" onClick={() => setStage('details')} className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                            <button type="submit" className="bg-primary-500 hover:bg-primary-600 shadow-primary px-10 py-4 rounded-2xl text-sm font-bold text-white transition-all flex items-center gap-2">
                                <ClipboardCheck size={18} /> Complete Assessment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (stage === 'details' && selectedInquiry) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                    onClick={() => setStage('list')}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary-500 transition-colors mb-6 font-bold text-sm"
                >
                    <ChevronLeft size={18} /> Back to Maintenance List
                </button>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    {selectedInquiry.inquiryNo}
                                </span>
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedInquiry.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                    selectedInquiry.status === 'Accepted' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {selectedInquiry.status}
                                </span>
                            </div>
                            <h1 className="text-3xl font-display font-black text-slate-900">{selectedInquiry.customerName}</h1>
                            <p className="text-slate-500 flex items-center gap-2 mt-1 font-medium">
                                <MapPin size={16} /> {selectedInquiry.location}
                            </p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-primary-50 rounded-xl text-primary-500">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Extinguisher ID</p>
                                <p className="font-black text-slate-900">{selectedInquiry.extinguisherId}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Info size={18} className="text-primary-500" /> Maintenance Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Service Type</p>
                                        <p className="font-bold text-slate-900">{selectedInquiry.details.type}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                                        <span className={`font-black uppercase text-[10px] tracking-widest ${selectedInquiry.details.priority === 'High' ? 'text-red-500' : 'text-amber-500'}`}>
                                            {selectedInquiry.details.priority}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Issue Reported</p>
                                    <p className="text-slate-700 italic leading-relaxed">"{selectedInquiry.details.issueReported}"</p>
                                </div>
                            </div>

                            {selectedInquiry.status === 'Assessment Done' && (
                                <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                                    <div>
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-600">
                                            <CheckCircle2 size={18} /> Assessment Summary
                                        </h3>
                                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 space-y-4">
                                            <div>
                                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Observations</p>
                                                <p className="text-slate-800 font-medium">{selectedInquiry.assessment?.observations}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Required Services</p>
                                                <p className="text-slate-800 font-medium">{selectedInquiry.assessment?.requiredServices}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Estimated Cost</p>
                                                <p className="text-2xl font-black text-emerald-700 font-display">${selectedInquiry.assessment?.cost}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <DocumentManagement />
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col justify-center gap-4 bg-slate-50/50 rounded-3xl p-8 border border-slate-100 border-dashed">
                            {selectedInquiry.status === 'Pending' ? (
                                <>
                                    <h4 className="text-center font-bold text-slate-600 mb-2 uppercase tracking-widest text-xs">Awaiting Partner Action</h4>
                                    <button
                                        onClick={() => handleAccept(selectedInquiry.id)}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" /> ACCEPT INQUIRY
                                    </button>
                                    <button
                                        onClick={() => handleReject(selectedInquiry.id)}
                                        className="w-full bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={20} /> REJECT
                                    </button>
                                </>
                            ) : selectedInquiry.status === 'Accepted' ? (
                                <>
                                    <div className="text-center space-y-2 mb-6">
                                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Inquiry Accepted</h4>
                                        <p className="text-sm text-slate-500">Proceed with the on-site technical assessment.</p>
                                    </div>
                                    <button
                                        onClick={() => setStage('assessment')}
                                        className="w-full bg-primary-500 hover:bg-primary-600 shadow-primary text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg"
                                    >
                                        <ClipboardCheck size={24} /> START SITE ASSESSMENT
                                    </button>
                                </>
                            ) : selectedInquiry.status === 'Assessment Done' ? (
                                <>
                                    <div className="text-center space-y-2 mb-6">
                                        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <DollarSign size={32} />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Assessment Complete</h4>
                                        <p className="text-sm text-slate-500">Convert findings into a formal quotation.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsQuotationOpen(true)}
                                        className="w-full bg-slate-900 hover:bg-black shadow-xl text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg"
                                    >
                                        <FileText size={24} /> GENERATE QUOTATION
                                    </button>
                                </>
                            ) : selectedInquiry.status === 'Quoted' ? (
                                <>
                                    <div className="text-center space-y-2 mb-6">
                                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Send size={32} />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Quotation Sent</h4>
                                        <p className="text-sm text-slate-500 font-medium italic">Awaiting client response...</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setLocalData(prev => prev.map(inq => inq.id === selectedInquiry.id ? { ...inq, status: 'Approved' } : inq));
                                            setSelectedInquiry(prev => ({ ...prev, status: 'Approved' }));
                                        }}
                                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all text-xs uppercase tracking-widest"
                                    >
                                        SIMULATE PO APPROVAL
                                    </button>
                                </>
                            ) : selectedInquiry.status === 'Approved' ? (
                                <>
                                    <div className="text-center space-y-2 mb-6">
                                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Star size={32} />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">PO Approved</h4>
                                        <p className="text-sm text-slate-500 font-medium">Job in progress. Upload Payoff to close.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const remark = prompt("Add Remark to Close Inquiry:", "POC received");
                                            if (remark) {
                                                setLocalData(prev => prev.map(inq => inq.id === selectedInquiry.id ? { ...inq, status: 'Closed', remarks: remark } : inq));
                                                setSelectedInquiry(prev => ({ ...prev, status: 'Closed', remarks: remark }));
                                                alert("Inquiry Closed with Remark: " + remark);
                                            }
                                        }}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-emerald text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                                    >
                                        CLOSE INQUIRY
                                    </button>
                                </>
                            ) : (
                                <div className="text-center space-y-4 py-8 animate-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-soft">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Process Complete</h4>
                                        <div className="mt-4 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm inline-block">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Remark</p>
                                            <p className="text-emerald-700 font-bold italic">"{selectedInquiry.remarks}"</p>
                                            <div className="mt-4 pt-4 border-t border-slate-50 flex flex-col items-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">CLOSED</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <QuotationModal
                    isOpen={isQuotationOpen}
                    onClose={() => setIsQuotationOpen(false)}
                    inquiry={selectedInquiry}
                    onSubmit={handleQuotationSubmit}
                />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/50">
                            <th className="px-6 py-4">Extinguisher ID</th>
                            <th className="px-6 py-4">Customer Name</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {localData.map((inq) => (
                            <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-primary-500 transition-colors"></div>
                                        {inq.extinguisherId}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-900">{inq.customerName}</p>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <MapPin size={14} className="text-slate-300" /> {inq.location}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${inq.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                        inq.status === 'Accepted' ? 'bg-blue-100 text-blue-700' :
                                            inq.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {inq.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => {
                                            setSelectedInquiry(inq);
                                            setStage('details');
                                        }}
                                        className="px-6 py-2 bg-slate-900 text-white hover:bg-primary-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-200 hover:shadow-primary"
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MaintenanceTab;
