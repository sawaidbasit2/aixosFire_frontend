import React, { useState } from 'react';
import { FileText, ChevronLeft, Calendar, MapPin, Tag, User } from 'lucide-react';
import DocumentManagement from './DocumentManagement';

const ValidationTab = ({ data }) => {
    const [selectedInquiry, setSelectedInquiry] = useState(null);

    if (selectedInquiry) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                    onClick={() => setSelectedInquiry(null)}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary-500 transition-colors mb-6 font-bold text-sm"
                >
                    <ChevronLeft size={18} /> Back to List
                </button>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-[10px] font-black uppercase tracking-wider mb-3 inline-block">
                                    Inquiry {selectedInquiry.id}
                                </span>
                                <h1 className="text-3xl font-display font-black text-slate-900">{selectedInquiry.clientName}</h1>
                                <p className="text-slate-500 flex items-center gap-2 mt-2">
                                    <MapPin size={16} /> {selectedInquiry.details.location}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Created Date</p>
                                <p className="text-slate-900 font-bold flex items-center justify-end gap-2">
                                    <Calendar size={16} className="text-primary-500" /> {selectedInquiry.details.createdDate}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <FileText size={20} className="text-primary-500" /> Agent Inquiry Details
                                </h3>
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned Agent</p>
                                            <p className="text-slate-900 font-bold flex items-center gap-2">
                                                <User size={16} className="text-primary-500" /> {selectedInquiry.agentName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Stickers Used</p>
                                            <p className="text-2xl font-black text-primary-600">{selectedInquiry.stickersUsed}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Agent Notes</p>
                                        <p className="text-slate-600 leading-relaxed italic">"{selectedInquiry.details.agentNotes}"</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Tag size={20} className="text-primary-500" /> Sticker Utilization Breakdown
                                </h3>
                                <div className="overflow-hidden border border-slate-100 rounded-2xl">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                <th className="px-6 py-4">Extinguisher Type</th>
                                                <th className="px-6 py-4">Quantity</th>
                                                <th className="px-6 py-4">Serial Range</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedInquiry.details.stickerUtilization.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-900">{item.type}</td>
                                                    <td className="px-6 py-4 text-slate-600">{item.count}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                                                            {item.serialRange}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <DocumentManagement />
                        </div>

                        <div className="space-y-6">
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
                                <h4 className="font-bold text-emerald-900 mb-2">Status: {selectedInquiry.status}</h4>
                                <p className="text-sm text-emerald-700 leading-relaxed">
                                    This inquiry has been verified by the agent and assigned to your dashboard for validation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/50">
                            <th className="px-6 py-4">Inquiry No</th>
                            <th className="px-6 py-4">Client Name</th>
                            <th className="px-6 py-4">Agent Name</th>
                            <th className="px-6 py-4">Stickers Used</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.map((inq) => (
                            <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-bold text-primary-600">{inq.id}</td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-900">{inq.clientName}</p>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-medium">{inq.agentName}</td>
                                <td className="px-6 py-4">
                                    <span className="text-lg font-black text-slate-900">{inq.stickersUsed}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${inq.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {inq.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedInquiry(inq)}
                                        className="text-primary-500 hover:text-primary-700 font-bold text-xs uppercase tracking-widest hover:underline transition-all"
                                    >
                                        View Details
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

export default ValidationTab;
