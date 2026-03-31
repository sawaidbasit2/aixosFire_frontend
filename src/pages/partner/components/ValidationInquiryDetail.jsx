import React from 'react';
import { FileText, Calendar, MapPin, Tag, User, MessageCircle } from 'lucide-react';

/**
 * Full-page Validation inquiry layout (Partner). Populated from buildValidationInquiryViewModel.
 */
const ValidationInquiryDetail = ({ viewModel }) => {
    const {
        badgeLabel,
        clientName,
        location,
        createdDate,
        agentName,
        stickersUsed,
        agentNotes,
        status,
        utilizationRows,
        customerEmail
    } = viewModel;

    const mailHref = customerEmail ? `mailto:${customerEmail}` : null;

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                    <div>
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-[10px] font-black uppercase tracking-wider mb-3 inline-block">
                            {badgeLabel}
                        </span>
                        <h1 className="text-3xl font-display font-black text-slate-900">{clientName}</h1>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                            <p className="text-slate-500 flex items-center gap-2">
                                <MapPin size={16} /> {location}
                            </p>
                            {mailHref ? (
                                <a
                                    href={mailHref}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-slate-200"
                                >
                                    <MessageCircle size={14} /> Message Customer
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    disabled
                                    title="No customer email on file"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                                >
                                    <MessageCircle size={14} /> Message Customer
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="text-left md:text-right shrink-0">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Created Date</p>
                        <p className="text-slate-900 font-bold flex items-center md:justify-end gap-2">
                            <Calendar size={16} className="text-primary-500" /> {createdDate}
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
                                        <User size={16} className="text-primary-500" /> {agentName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Stickers Used</p>
                                    <p className="text-2xl font-black text-primary-600">{stickersUsed}</p>
                                </div>
                            </div>
                            <div className="mt-6">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Agent Notes</p>
                                <p className="text-slate-600 leading-relaxed italic">
                                    {agentNotes ? `"${agentNotes}"` : '—'}
                                </p>
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
                                    {utilizationRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                                No utilization data available
                                            </td>
                                        </tr>
                                    ) : (
                                        utilizationRows.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-900">{item.type}</td>
                                                <td className="px-6 py-4 text-slate-600">{item.count}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                                                        {item.serialRange}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
                        <h4 className="font-bold text-emerald-900 mb-2">Status: {status}</h4>
                        <p className="text-sm text-emerald-700 leading-relaxed">
                            This inquiry has been verified by the agent and assigned to your dashboard for validation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ValidationInquiryDetail;
