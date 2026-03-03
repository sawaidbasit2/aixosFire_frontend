import React from 'react';
import { Package, MapPin, Send } from 'lucide-react';

const NewUnitTab = ({ data }) => {
    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/50">
                            <th className="px-6 py-4">Inquiry No</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Unit Type</th>
                            <th className="px-6 py-4">Quantity</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.map((inq) => (
                            <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-black text-primary-600 tracking-tighter">{inq.inquiryNo}</td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-900">{inq.customer}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-primary-50 rounded-xl text-primary-500">
                                            <Package size={16} />
                                        </div>
                                        <span className="font-bold text-slate-700">{inq.unitType}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xl font-black text-slate-900">{inq.quantity}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${inq.status === 'Quoted' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {inq.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="px-6 py-2 bg-slate-900 text-white hover:bg-primary-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-200">
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data.length === 0 && (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <Package size={24} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No new unit inquiries found.</p>
                </div>
            )}
        </div>
    );
};

export default NewUnitTab;
