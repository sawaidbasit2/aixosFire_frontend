import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import PageLoader from '../../components/PageLoader';
import {
    ArrowLeft, DollarSign, CheckCircle, XCircle, Activity,
    Eye, FileText, TrendingUp, TrendingDown
} from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString();

const QuotationAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [quotations, setQuotations] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const { data, error } = await supabase
                    .from('quotations')
                    .select('id, estimated_cost, inquiry_id, status, created_at, inquiries(id, inquiry_no, status, type, customers(business_name))')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setQuotations(data || []);
            } catch (err) {
                console.error('QuotationAnalytics load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <PageLoader message="Loading quotation analytics..." />;

    /* ── Calculations ─────────────────────────────────── */
    const total = quotations.length;
    const totalValue = quotations.reduce((sum, q) => sum + (Number(q.estimated_cost) || 0), 0);

    const isWon   = (q) => ['completed', 'accepted', 'closed'].includes((q.inquiries?.status || '').toLowerCase());
    const isLost  = (q) => ['rejected', 'cancelled'].includes((q.inquiries?.status || '').toLowerCase());
    const isActive = (q) => !isWon(q) && !isLost(q);

    const wonQuotes    = quotations.filter(isWon);
    const lostQuotes   = quotations.filter(isLost);
    const activeQuotes = quotations.filter(isActive);

    const wonValue    = wonQuotes.reduce((sum, q)    => sum + (Number(q.estimated_cost) || 0), 0);
    const lostValue   = lostQuotes.reduce((sum, q)   => sum + (Number(q.estimated_cost) || 0), 0);
    const activeValue = activeQuotes.reduce((sum, q) => sum + (Number(q.estimated_cost) || 0), 0);

    const wonRate    = total ? Math.round((wonQuotes.length    / total) * 100) : 0;
    const lostRate   = total ? Math.round((lostQuotes.length   / total) * 100) : 0;

    const wonPct    = totalValue ? Math.round((wonValue    / totalValue) * 100) : 0;
    const lostPct   = totalValue ? Math.round((lostValue   / totalValue) * 100) : 0;
    const activePct = totalValue ? Math.round((activeValue / totalValue) * 100) : 0;

    const getBadge = (q) => {
        if (isWon(q))   return { cls: 'bg-green-100 text-green-700',  label: 'Won' };
        if (isLost(q))  return { cls: 'bg-red-100 text-red-600',      label: 'Lost' };
        return                  { cls: 'bg-blue-100 text-blue-700',   label: 'Active' };
    };

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div>
                <Link
                    to="/admin/dashboard"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-3 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Admin Panel</p>
                <h1 className="text-2xl font-display font-bold text-slate-900">Quotation Analytics</h1>
                <p className="text-slate-500 text-sm mt-0.5">Pipeline breakdown of all quoted inquiries.</p>
            </div>

            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Total */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <div className="p-3 rounded-2xl bg-violet-500 w-fit mb-4">
                        <DollarSign size={20} className="text-white" />
                    </div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Quoted Value</p>
                    <h3 className="text-2xl font-bold text-slate-900">SAR {fmt(totalValue)}</h3>
                    <p className="text-xs text-slate-400 mt-1">{total} quotation{total !== 1 ? 's' : ''} total</p>
                </div>

                {/* Won */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-500 w-fit">
                            <CheckCircle size={20} className="text-white" />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-green-100 text-green-700 flex items-center gap-1">
                            <TrendingUp size={11} /> {wonRate}%
                        </span>
                    </div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Won Quotations</p>
                    <h3 className="text-2xl font-bold text-slate-900">SAR {fmt(wonValue)}</h3>
                    <p className="text-xs text-emerald-600 font-semibold mt-1">{wonRate}% win rate · {wonQuotes.length} closed</p>
                </div>

                {/* Active */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <div className="p-3 rounded-2xl bg-blue-500 w-fit mb-4">
                        <Activity size={20} className="text-white" />
                    </div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Active (In Progress)</p>
                    <h3 className="text-2xl font-bold text-slate-900">SAR {fmt(activeValue)}</h3>
                    <p className="text-xs text-blue-600 font-semibold mt-1">{activePct}% of total · {activeQuotes.length} active</p>
                </div>

                {/* Lost */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-red-500 w-fit">
                            <XCircle size={20} className="text-white" />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-red-100 text-red-600 flex items-center gap-1">
                            <TrendingDown size={11} /> {lostRate}%
                        </span>
                    </div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Lost Quotations</p>
                    <h3 className="text-2xl font-bold text-slate-900">SAR {fmt(lostValue)}</h3>
                    <p className="text-xs text-red-500 font-semibold mt-1">{lostRate}% loss rate · {lostQuotes.length} lost</p>
                </div>
            </div>

            {/* ── Pipeline Breakdown ── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                <h3 className="font-bold text-slate-900 mb-6">Pipeline Breakdown</h3>

                {total === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">No quotation data yet.</p>
                ) : (
                    <div className="space-y-6">

                        {/* Won */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                    <span className="text-sm font-semibold text-slate-700">Won</span>
                                    <span className="text-xs text-slate-400">{wonQuotes.length} quotation{wonQuotes.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-emerald-600">{wonPct}%</span>
                                    <span className="text-sm font-bold text-slate-900 min-w-[100px] text-right">SAR {fmt(wonValue)}</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div className="h-2.5 rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${wonPct}%` }} />
                            </div>
                        </div>

                        {/* Active */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                                    <span className="text-sm font-semibold text-slate-700">Active / In Progress</span>
                                    <span className="text-xs text-slate-400">{activeQuotes.length} quotation{activeQuotes.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-blue-600">{activePct}%</span>
                                    <span className="text-sm font-bold text-slate-900 min-w-[100px] text-right">SAR {fmt(activeValue)}</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div className="h-2.5 rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${activePct}%` }} />
                            </div>
                        </div>

                        {/* Lost */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
                                    <span className="text-sm font-semibold text-slate-700">Lost / Closed</span>
                                    <span className="text-xs text-slate-400">{lostQuotes.length} quotation{lostQuotes.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-red-500">{lostPct}%</span>
                                    <span className="text-sm font-bold text-slate-900 min-w-[100px] text-right">SAR {fmt(lostValue)}</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div className="h-2.5 rounded-full bg-red-400 transition-all duration-700" style={{ width: `${lostPct}%` }} />
                            </div>
                        </div>

                        {/* Stacked visual bar */}
                        <div className="pt-2">
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Total Value Distribution</p>
                            <div className="w-full h-4 rounded-full overflow-hidden flex">
                                {wonPct > 0    && <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${wonPct}%` }} title={`Won: ${wonPct}%`} />}
                                {activePct > 0 && <div className="h-full bg-blue-500 transition-all duration-700"    style={{ width: `${activePct}%` }} title={`Active: ${activePct}%`} />}
                                {lostPct > 0   && <div className="h-full bg-red-400 transition-all duration-700"     style={{ width: `${lostPct}%` }} title={`Lost: ${lostPct}%`} />}
                                {(wonPct + activePct + lostPct) === 0 && <div className="h-full w-full bg-slate-200 rounded-full" />}
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Won</span>
                                <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-blue-500" /> Active</span>
                                <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-red-400" /> Lost</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── All Quotations Table ── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">All Quotations</h3>
                    <span className="text-xs text-slate-400 font-medium">{total} total</span>
                </div>

                {total === 0 ? (
                    <div className="p-12 text-center">
                        <FileText size={32} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-slate-400 text-sm">No quotations yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/70 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Quoted Value</th>
                                    <th className="px-6 py-4">Pipeline</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {quotations.map((q) => {
                                    const badge = getBadge(q);
                                    return (
                                        <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                                {q.inquiries?.customers?.business_name || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 capitalize">
                                                {q.inquiries?.type || '—'}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                                                SAR {fmt(q.estimated_cost)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${badge.cls}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">
                                                {new Date(q.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {q.inquiry_id && (
                                                    <Link
                                                        to={`/admin/inquiries/${q.inquiry_id}`}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-800"
                                                    >
                                                        <Eye size={12} /> View
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuotationAnalytics;
