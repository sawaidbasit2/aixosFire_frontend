import React, { useState } from 'react';
import {
    Cylinder, Truck, User,
    ArrowRight, CheckCircle2, XCircle,
    Info, DollarSign, Split
} from 'lucide-react';

const RefilledTab = ({ data }) => {
    const [localData, setLocalData] = useState(data);
    const [processInquiry, setProcessInquiry] = useState(null); // The inquiry being partially accepted/rejected
    const [acceptedCount, setAcceptedCount] = useState(0);

    const handleProcess = (inq) => {
        setProcessInquiry(inq);
        setAcceptedCount(inq.totalCylinders);
    };

    const handleFinalize = () => {
        const rejectedCount = processInquiry.totalCylinders - acceptedCount;
        setLocalData(prev => prev.map(inq =>
            inq.id === processInquiry.id
                ? { ...inq, status: acceptedCount === inq.totalCylinders ? 'Accepted' : 'Partially Accepted', acceptedCount, rejectedCount }
                : inq
        ));
        if (rejectedCount > 0) {
            alert(`Finalized: ${acceptedCount} accepted, ${rejectedCount} rejected.\nRejected cylinders will be re-allocated.`);
        } else {
            alert(`All ${acceptedCount} cylinders accepted!`);
        }
        setProcessInquiry(null);
    };

    if (processInquiry) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Process Refill Request</h2>
                            <p className="text-slate-500 font-medium">Inquiry: {processInquiry.inquiryNo} | {processInquiry.customerName}</p>
                        </div>
                        <button onClick={() => setProcessInquiry(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><XCircle size={24} /></button>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Split size={20} className="text-primary-500" /> Partial Accept/Reject Logic
                                </h3>
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 italic text-sm text-slate-600 mb-6 leading-relaxed">
                                    Requirement: Partner receives 100 inquiries but can only refill 80.
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Accept Cylinders</p>
                                            <p className="text-2xl font-black text-primary-600">{acceptedCount} / {processInquiry.totalCylinders}</p>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max={processInquiry.totalCylinders}
                                            value={acceptedCount}
                                            onChange={(e) => setAcceptedCount(parseInt(e.target.value))}
                                            className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                        />
                                        <div className="flex justify-between mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>0</span>
                                            <span>{processInquiry.totalCylinders} Max</span>
                                        </div>
                                    </div>
                                    <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3 text-red-700">
                                        <XCircle size={20} className="flex-shrink-0" />
                                        <p className="text-xs font-medium">
                                            <strong>{processInquiry.totalCylinders - acceptedCount}</strong> cylinders will be rejected and re-allocated back to the system.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Truck size={20} className="text-primary-500" /> Pricing Breakdown UI
                                </h3>
                                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                        <p className="text-slate-500 font-medium">Refilling Charges</p>
                                        <p className="font-display font-black text-slate-900 text-lg">${processInquiry.breakdown.fillingCharges} <span className="text-xs text-slate-400 font-bold">/ unit</span></p>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <p className="text-slate-500 font-medium">Transport Charges</p>
                                            {processInquiry.pickupType === 'Self Pickup' && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black uppercase">Chargeable</span>}
                                        </div>
                                        <p className="font-display font-black text-emerald-600 text-lg">${processInquiry.breakdown.transportCharges} <span className="text-xs text-slate-400 font-bold">/ unit</span></p>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <p className="text-slate-900 font-black uppercase text-sm">Estimated Total Per Unit</p>
                                        <p className="font-display font-black text-primary-600 text-2xl">${processInquiry.breakdown.fillingCharges + processInquiry.breakdown.transportCharges}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end space-y-4">
                            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                                <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2 uppercase tracking-widest text-xs">
                                    <Info size={16} /> Pickup Strategy: {processInquiry.pickupType}
                                </h4>
                                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                    {processInquiry.pickupType === 'Self Pickup'
                                        ? "Partner is responsible for pickup. Transportation charges of $3/unit are added."
                                        : "Agent or Customer will drop the units. Transport charge is $0."}
                                </p>
                            </div>

                            <div className="space-y-3 pt-6">
                                <button
                                    onClick={handleFinalize}
                                    className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl transform active:scale-95 transition-all text-lg shadow-xl shadow-slate-200"
                                >
                                    FINALIZE SELECTION
                                </button>
                                <button
                                    onClick={() => setProcessInquiry(null)}
                                    className="w-full bg-white text-slate-400 font-bold py-4 rounded-2xl hover:text-slate-600 transition-all text-sm"
                                >
                                    CANCEL PROCESS
                                </button>
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
                            <th className="px-6 py-4">Customer Name</th>
                            <th className="px-6 py-4">Cylinders</th>
                            <th className="px-6 py-4">Pickup Type</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {localData.map((inq) => (
                            <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-black text-primary-600 text-sm tracking-tighter">{inq.inquiryNo}</td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-900">{inq.customerName}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                                            <Cylinder size={16} />
                                        </div>
                                        <span className="text-lg font-black text-slate-900">{inq.totalCylinders}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-slate-600 text-xs font-bold bg-slate-50 pr-4 pl-1 py-1 rounded-full w-fit">
                                        <div className="p-1 px-2 bg-white rounded-full border border-slate-100 shadow-sm">
                                            <Truck size={12} className="text-primary-500" />
                                        </div>
                                        {inq.pickupType}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit ${inq.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                inq.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                    inq.status === 'Partially Accepted' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {inq.status}
                                        </span>
                                        {inq.acceptedCount !== undefined && (
                                            <p className="text-[10px] font-bold text-slate-400">Acc: {inq.acceptedCount} | Rej: {inq.rejectedCount}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        disabled={inq.status === 'Completed'}
                                        onClick={() => handleProcess(inq)}
                                        className="px-6 py-2 bg-slate-900 text-white hover:bg-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-200 disabled:opacity-30 disabled:shadow-none"
                                    >
                                        Process
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

export default RefilledTab;
