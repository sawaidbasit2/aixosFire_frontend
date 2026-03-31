import React from 'react';
import { FileText, Download, Calendar, User, History } from 'lucide-react';

const DocumentManagement = ({ documents = [] }) => {
    const displayDocs = Array.isArray(documents) ? documents : [];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <History size={20} className="text-primary-500" /> Document History
            </h3>
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-soft">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 py-4">Document Name</th>
                            <th className="px-6 py-4">Upload Date</th>
                            <th className="px-6 py-4">By</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {displayDocs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                    No data available
                                </td>
                            </tr>
                        )}
                        {displayDocs.map((doc, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary-50 text-primary-500 rounded-xl group-hover:bg-primary-500 group-hover:text-white transition-all">
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.type}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={12} /> {doc.date}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-slate-900">
                                    <div className="flex items-center gap-2">
                                        <User size={12} className="text-primary-500" /> {doc.uploader}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 text-primary-500 transition-all flex items-center justify-end gap-2 ml-auto">
                                        <Download size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Download</span>
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

export default DocumentManagement;
