import React, { useState } from 'react';
import { FileText, Calendar, MapPin, Tag, User, MessageCircle, Hash, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import CustomerContactSection from './CustomerContactSection';

const ValidationInquiryDetail = ({ viewModel, inquiryItems = [] }) => {
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
        customerEmail,
        customerPhone,
        customerOwnerName,
        customerId,
        customerAddress,
        customerLocationLat,
        customerLocationLng,
    } = viewModel;

    const [expandedRow, setExpandedRow] = useState(null);

    const mailHref = customerEmail ? `mailto:${customerEmail}` : null;

    const formatDetailValue = (val) => (val == null || val === '') ? '—' : String(val);

    const DetailCell = ({ label, value }) => (
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm font-semibold text-slate-800">{formatDetailValue(value)}</p>
        </div>
    );

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-soft-xl overflow-hidden">

            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                    <div className="flex-1 min-w-0">
                        <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-2xl text-xs font-black uppercase tracking-widest inline-block mb-4">
                            {badgeLabel}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight break-words">
                            {clientName}
                        </h1>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
                            <p className="text-slate-600 flex items-center gap-2">
                                <MapPin size={18} className="text-slate-400 shrink-0" />
                                {location}
                            </p>
                            {mailHref ? (
                                <a
                                    href={mailHref}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-primary-600 text-white rounded-2xl text-sm font-medium transition-all w-full sm:w-auto"
                                >
                                    <MessageCircle size={18} />
                                    Message Customer
                                </a>
                            ) : (
                                <button
                                    disabled
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-200 text-slate-500 rounded-2xl text-sm font-medium w-full sm:w-auto cursor-not-allowed"
                                >
                                    <MessageCircle size={18} />
                                    Message Customer
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="text-left md:text-right shrink-0">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Created Date</p>
                        <p className="text-slate-900 font-bold flex items-center md:justify-end gap-2">
                            <Calendar size={18} className="text-primary-500" /> {createdDate}
                        </p>
                    </div>
                </div>
            </div>

            {/* Customer Contact */}
            <div className="px-6 md:px-8 lg:px-10 pt-6 md:pt-8">
                <CustomerContactSection
                    ownerName={customerOwnerName}
                    email={customerEmail}
                    phone={customerPhone}
                    customerId={customerId}
                    address={customerAddress}
                    locationLat={customerLocationLat}
                    locationLng={customerLocationLng}
                />
            </div>

            {/* Main Content */}
            <div className="p-6 md:p-8 lg:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left / Main Column */}
                    <div className="lg:col-span-8 space-y-10">

                        {/* Agent Inquiry Details */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-3">
                                <FileText size={22} className="text-primary-500" />
                                Agent Inquiry Details
                            </h3>
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Assigned Agent</p>
                                        <p className="text-slate-900 font-bold flex items-center gap-2">
                                            <User size={18} className="text-primary-500" /> {agentName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Stickers Used</p>
                                        <p className="text-3xl font-black text-primary-600">{stickersUsed}</p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Agent Notes</p>
                                    <p className="text-slate-600 leading-relaxed italic">
                                        {agentNotes ? `"${agentNotes}"` : 'No notes provided.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sticker Utilization Breakdown */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-3">
                                <Tag size={22} className="text-primary-500" />
                                Sticker Utilization Breakdown
                            </h3>
                            <div className="overflow-hidden border border-slate-100 rounded-3xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <th className="px-6 py-5">Extinguisher Type</th>
                                            <th className="px-6 py-5">Quantity</th>
                                            <th className="px-6 py-5">Serial Range</th>
                                            <th className="px-6 py-5 text-right">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {utilizationRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-16 text-center text-slate-400 font-medium">
                                                    No utilization data available
                                                </td>
                                            </tr>
                                        ) : (
                                            utilizationRows.map((item, idx) => {
                                                const detail = inquiryItems[idx] || null;
                                                const isExpanded = expandedRow === idx;

                                                return (
                                                    <React.Fragment key={idx}>
                                                        <tr className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-5 font-semibold text-slate-900">{item.type}</td>
                                                            <td className="px-6 py-5 text-slate-700 font-medium">{item.count}</td>
                                                            <td className="px-6 py-5">
                                                                <span className="px-4 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium">
                                                                    {item.serialRange}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                {detail && (
                                                                    <button
                                                                        onClick={() => setExpandedRow(isExpanded ? null : idx)}
                                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider transition-colors"
                                                                    >
                                                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                        {isExpanded ? 'Hide' : 'View Details'}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>

                                                        {isExpanded && detail && (
                                                            <tr>
                                                                <td colSpan={4} className="px-6 pb-6 pt-0 bg-primary-50/20 border-b border-slate-100">
                                                                    <div className="bg-white rounded-2xl border border-slate-100 p-5 mt-2">
                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                                                                            <DetailCell label="Capacity" value={detail.capacity} />
                                                                            <DetailCell label="Status" value={detail.status} />
                                                                            <DetailCell label="Validation Mode" value={detail.validation_mode} />
                                                                            <DetailCell label="Serial No." value={detail.serial_no} />
                                                                            {detail.system_type && (
                                                                                <DetailCell label="System Type" value={detail.system_type} />
                                                                            )}
                                                                            {detail.system && (
                                                                                <DetailCell label="System" value={detail.system} />
                                                                            )}
                                                                            {detail.follow_up_date_validation && (
                                                                                <DetailCell label="Follow-up Date" value={detail.follow_up_date_validation} />
                                                                            )}
                                                                            {detail.maintenance_notes && (
                                                                                <DetailCell label="Notes" value={detail.maintenance_notes} />
                                                                            )}
                                                                        </div>
                                                                        {detail.extinguisher_photo && (
                                                                            <div className="mt-5 pt-4 border-t border-slate-100">
                                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Photo Reference</p>
                                                                                <a
                                                                                    href={detail.extinguisher_photo}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-block"
                                                                                >
                                                                                    <img
                                                                                        src={detail.extinguisher_photo}
                                                                                        alt="Photo reference"
                                                                                        className="h-24 w-24 object-cover rounded-xl border border-slate-200 shadow-sm hover:opacity-90 transition-opacity"
                                                                                    />
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="bg-emerald-50 border border-emerald-100 p-7 rounded-3xl sticky top-6">
                            <h4 className="font-bold text-emerald-900 text-lg mb-3">Status: {status}</h4>
                            <p className="text-sm text-emerald-700 leading-relaxed">
                                This inquiry has been verified by the agent and assigned to your dashboard for validation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ValidationInquiryDetail;
