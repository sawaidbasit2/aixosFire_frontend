import React, { useEffect, useState } from 'react';
import {
    Package, MessageSquare, Layout, ExternalLink, Clock,
    AlertCircle, CheckCircle, XCircle, FileText, Send,
    MapPin, TrendingUp, DollarSign, PieChart
} from 'lucide-react';
import { getPartnerDashboard } from '../../api/partners';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../../components/PageLoader';
import QuotationModal from '../../components/QuotationModal';
import SiteVisitForm from './SiteVisitForm';

const StatCard = ({ icon: Icon, title, value, color, trend }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft hover:shadow-lg transition-all duration-300 group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10 transition-transform group-hover:scale-110`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            {trend && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp size={10} /> {trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-display font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>
    </div>
);

const PartnerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        activeInquiries: 0,
        pendingInquiries: 0,
        totalSales: 0,
        validate: { totalStickers: 0, usedStickers: 0 },
        refilled: { received: 0, answered: 0, pending: 0, rejected: 0 },
        maintenance: []
    });
    const [activeTab, setActiveTab] = useState('Maintenance');
    const [loading, setLoading] = useState(true);
    const [isQuotationOpen, setIsQuotationOpen] = useState(false);
    const [isSiteVisitOpen, setIsSiteVisitOpen] = useState(false);
    const [selectedInquiry, setSelectedInquiry] = useState(null);

    const handleQuotationSubmit = async (data) => {
        console.log('Submitting quotation:', data);
        // await submitQuotation(data);
        alert('Quotation submitted successfully!');
    };

    const handleSiteVisitSubmit = async (data) => {
        console.log('Submitting site visit:', data);
        // await submitSiteVisit(data);
        // alert('Site visit record submitted!');
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                const data = await getPartnerDashboard();
                // Merge with dummy data if API doesn't provide all new fields yet
                setStats({
                    activeInquiries: data.stats.activeQueries || 12,
                    pendingInquiries: 5,
                    totalSales: 12500,
                    validate: { totalStickers: 500, usedStickers: 342 },
                    refilled: { received: 24, answered: 18, pending: 4, rejected: 2 },
                    maintenance: [
                        { id: 1, client: 'Grand Regency Hotel', date: '2024-03-25', status: 'Pending', approached: false },
                        { id: 2, client: 'Tech Park Plaza', date: '2024-03-22', status: 'Quoted', approached: true },
                        { id: 3, client: 'Sunrise Apartments', date: '2024-03-20', status: 'Visit Scheduled', approached: true }
                    ],
                    ...data.stats
                });
            } catch (err) {
                console.error('Error fetching partner dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    if (loading) return <PageLoader message="Loading partner dashboard..." />;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Validate':
                const usedPercent = Math.round((stats.validate.usedStickers / stats.validate.totalStickers) * 100);
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft">
                            <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <PieChart size={20} className="text-primary-500" /> Sticker Utilization
                            </h4>
                            <div className="flex items-center gap-8">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - usedPercent / 100)} className="text-primary-500 transition-all duration-1000" />
                                    </svg>
                                    <span className="absolute text-2xl font-black text-slate-900">{usedPercent}%</span>
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-slate-500">Total Stickers</p>
                                        <p className="text-lg font-bold text-slate-900">{stats.validate.totalStickers}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-slate-500">Used Stickers</p>
                                        <p className="text-lg font-bold text-emerald-600">{stats.validate.usedStickers}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-slate-500">Remaining</p>
                                        <p className="text-lg font-bold text-slate-400">{stats.validate.totalStickers - stats.validate.usedStickers}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    <strong>Partner Security:</strong> Detailed sticker tracking information is restricted. Please contact admin for full audit logs.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'Refilled':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {[
                            { label: 'Received', value: stats.refilled.received, color: 'bg-blue-500' },
                            { label: 'Answered', value: stats.refilled.answered, color: 'bg-emerald-500' },
                            { label: 'Pending', value: stats.refilled.pending, color: 'bg-amber-500' },
                            { label: 'Rejected', value: stats.refilled.rejected, color: 'bg-red-500' }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                                <h4 className={`text-3xl font-black ${item.color.replace('bg-', 'text-')}`}>{item.value}</h4>
                            </div>
                        ))}
                    </div>
                );

            case 'Maintenance':
                return (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/50">
                                        <th className="px-6 py-4">Client Detail</th>
                                        <th className="px-6 py-4">Inquiry Date</th>
                                        <th className="px-6 py-4">Approached</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stats.maintenance.map((inq) => (
                                        <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                                                        <FileText size={18} />
                                                    </div>
                                                    <p className="font-bold text-slate-900">{inq.client}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                    <Clock size={14} /> {new Date(inq.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`flex items-center gap-1.5 text-xs font-bold ${inq.approached ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {inq.approached ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                    {inq.approached ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${inq.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                    inq.status === 'Quoted' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {inq.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedInquiry(inq);
                                                            setIsQuotationOpen(true);
                                                        }}
                                                        className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-primary-500 transition-all tooltip"
                                                        title="Submit Quotation"
                                                    >
                                                        <Send size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedInquiry(inq);
                                                            setIsSiteVisitOpen(true);
                                                        }}
                                                        className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-emerald-500 transition-all font-bold text-xs flex items-center gap-1"
                                                        title="Schedule Site Visit"
                                                    >
                                                        <MapPin size={18} />
                                                        <span className="hidden lg:inline">Site Visit</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'New Unit':
                return (
                    <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-soft text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package size={40} className="text-primary-500" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">New Unit Inquiries</h4>
                        <p className="text-slate-500 max-w-md mx-auto mt-2">
                            Manage requests for new fire safety equipment installations. No active inquiries in this category at the moment.
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
                        Partners <span className="text-primary-500">Panel.</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 italic">Welcome back, {user?.name || 'Partner'}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={MessageSquare}
                    title="Active Inquiries"
                    value={stats.activeInquiries}
                    color="bg-primary-500"
                    trend="+3 today"
                />
                <StatCard
                    icon={Clock}
                    title="Pending Inquiries"
                    value={stats.pendingInquiries}
                    color="bg-amber-500"
                />
                <StatCard
                    icon={DollarSign}
                    title="Total Sales"
                    value={`$${stats.totalSales.toLocaleString()}`}
                    color="bg-emerald-500"
                    trend="+12% vs last month"
                />
            </div>

            {/* Inquiries Section */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-2">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Layout size={22} className="text-primary-500" /> Inquiry Management
                    </h3>
                    <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
                        {['Validate', 'Maintenance', 'New Unit', 'Refilled'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeTab === tab
                                    ? 'bg-white text-primary-500 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {renderTabContent()}
            </div>

            <QuotationModal
                isOpen={isQuotationOpen}
                onClose={() => setIsQuotationOpen(false)}
                inquiry={selectedInquiry}
                onSubmit={handleQuotationSubmit}
            />

            <SiteVisitForm
                isOpen={isSiteVisitOpen}
                onClose={() => setIsSiteVisitOpen(false)}
                inquiry={selectedInquiry}
                onSubmit={handleSiteVisitSubmit}
            />
        </div>
    );
};

export default PartnerDashboard;

