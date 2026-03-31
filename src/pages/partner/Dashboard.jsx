import React, { useState, useEffect } from 'react';
import {
    Layout, Clock,
    DollarSign, Users, Filter, Plus, ChevronRight,
    CheckCircle2, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPartnerDashboard, getPartnerStats, getInquiries } from '../../api/partners';

// Sub-components - No longer used inline; replaced by independent pages.

/** Statuses that count as "closed" for the Partner dashboard card (matches resolved / accepted work). */
const CLOSED_LIKE_STATUSES = new Set([
    'accepted',
    'closed',
    'completed',
    'approved',
    'inquiry closed'
]);

const countClosedLikeInquiries = (inquiries) => {
    if (!Array.isArray(inquiries)) return 0;
    return inquiries.filter((inq) => {
        const s = (inq.status ?? '').toString().trim().toLowerCase();
        return CLOSED_LIKE_STATUSES.has(s);
    }).length;
};

const StatCard = (props) => {
    const { icon: Icon, title, value, color, subtitle } = props;
    return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-soft hover:shadow-lg transition-all duration-300 group cursor-pointer overflow-hidden relative">
        <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-[0.03] -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-150`}></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10 transition-transform group-hover:scale-110`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
        </div>
        <div className="relative z-10">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight">{value}</h3>
            {subtitle && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{subtitle}</p>}
        </div>
    </div>
    );
};

const PartnerDashboard = () => {
    const [filterType, setFilterType] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inquiries, setInquiries] = useState([]);
    const [stats, setStats] = useState({
        activeInquiries: 0,
        pendingInquiries: 0,
        closedInquiries: 0,
        totalSales: 0,
        totalAgents: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const query = { type: filterType !== 'All' ? filterType : undefined };
                const [dashboardData, statsData, inquiriesData] = await Promise.all([
                    getPartnerDashboard(),
                    getPartnerStats(),
                    getInquiries(query)
                ]);
                const allInquiriesForStats =
                    filterType === 'All'
                        ? inquiriesData
                        : await getInquiries({});
                const dashboardStats = dashboardData?.stats || {};
                const resolvedStats = {
                    ...dashboardStats,
                    ...statsData
                };
                const list = Array.isArray(allInquiriesForStats) ? allInquiriesForStats : [];
                const closedFromList = countClosedLikeInquiries(list);
                const apiClosed =
                    Number(resolvedStats.closed_inquiries || 0) +
                    Number(resolvedStats.accepted_inquiries || 0);
                const closedInquiries = list.length > 0 ? closedFromList : apiClosed;

                if (import.meta.env.DEV) {
                    console.debug('[PartnerDashboard] stats', {
                        resolvedStats,
                        closedFromList,
                        apiClosed,
                        closedInquiries,
                        inquiriesLoaded: list.length
                    });
                }

                setStats({
                    activeInquiries: resolvedStats.active_inquiries || 0,
                    pendingInquiries: resolvedStats.pending_inquiries || 0,
                    closedInquiries,
                    totalSales: resolvedStats.total_sales || 0,
                    totalAgents: resolvedStats.total_agents || 0
                });
                setInquiries(Array.isArray(inquiriesData) ? inquiriesData : []);
                setError(null);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [filterType]);


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="text-primary-500 animate-spin" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="bg-red-50 border border-red-100 rounded-[2rem] p-12 text-center max-w-lg">
                    <h3 className="text-red-900 text-xl font-black mb-2 tracking-tight">Data Sync Error</h3>
                    <p className="text-red-600 text-sm font-medium mb-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="px-8 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all">Retry Sync</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 animate-in fade-in duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12 animate-in slide-in-from-bottom-6 duration-700 delay-100">
                <StatCard icon={Layout} title="Total Active" value={stats.activeInquiries} color="bg-primary-500" subtitle="Inquiries" />
                <StatCard icon={Clock} title="Total Pending" value={stats.pendingInquiries} color="bg-amber-500" subtitle="Awaiting Action" />
                <StatCard icon={CheckCircle2} title="Total Closed" value={stats.closedInquiries} color="bg-emerald-500" subtitle="Past 30 Days" />
                <StatCard icon={DollarSign} title="Total Sales" value={`$${(stats.totalSales || 0).toLocaleString()}`} color="bg-indigo-500" subtitle="Gross Profit" />
                <StatCard icon={Users} title="Total Agents" value={stats.totalAgents || 0} color="bg-pink-500" subtitle="Active Field Teams" />
            </div>

            {/* Main Application Area */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-1000 delay-200">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">
                            All <span className="text-primary-500">Inquiries.</span>
                        </h2>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Showing {inquiries.length} results
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary-500 transition-colors" size={16} />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="pl-12 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="All">All Types</option>
                                <option value="Validation">Validation</option>
                                <option value="Refilled">Refilled</option>
                                <option value="New Unit">New Unit</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <Plus size={14} className="rotate-45" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/50">
                                    <th className="px-8 py-6">Inquiry No</th>
                                    <th className="px-8 py-6">Client Name</th>
                                    <th className="px-8 py-6">Inquiry Type</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {inquiries.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                            No data available
                                        </td>
                                    </tr>
                                )}
                                {inquiries.map((inq) => (
                                <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6 font-black text-primary-600 text-sm tracking-tighter">
                                        {inq.inquiry_no}
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-slate-900">{inq.customers?.business_name || 'Generic Client'}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                            (inq.type || inq.inquiry_type) === 'Validation' ? 'bg-blue-50 text-blue-600' :
                                            (inq.type || inq.inquiry_type) === 'Refilled' ? 'bg-purple-50 text-purple-600' :
                                            (inq.type || inq.inquiry_type) === 'New Unit' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            {inq.type || inq.inquiry_type || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            ['active', 'completed', 'accepted'].includes(inq.status?.toLowerCase()) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {inq.status}
                                        </span>
                                    </td>
                                        <td className="px-8 py-6 text-right">
                                            <Link
                                                to={`/partner/inquiry/${inq.id}`}
                                                className="px-6 py-2 bg-slate-900 text-white hover:bg-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-200 hover:shadow-primary inline-block"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerDashboard;

