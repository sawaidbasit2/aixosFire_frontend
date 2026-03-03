import React, { useState } from 'react';
import {
    Layout, Clock, MessageSquare,
    DollarSign, Users, Bell,
    Search, Filter, Plus, ChevronRight,
    CheckCircle2
} from 'lucide-react';

// Sub-components
import ValidationTab from './components/ValidationTab';
import MaintenanceTab from './components/MaintenanceTab';
import RefilledTab from './components/RefilledTab';
import NewUnitTab from './components/NewUnitTab';

// Dummy Data
import {
    validationInquiries,
    maintenanceInquiries,
    refilledInquiries,
    newUnitInquiries
} from '../../data/partnerDummyData';

const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
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

const PartnerDashboard = () => {
    const [activeTab, setActiveTab] = useState('Validation');
    const [stats] = useState({
        activeInquiries: 12,
        pendingInquiries: 5,
        closedInquiries: 142,
        totalSales: 12500,
        totalAgents: 8
    });

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Validation': return <ValidationTab data={validationInquiries} />;
            case 'Maintenance': return <MaintenanceTab data={maintenanceInquiries} />;
            case 'Refilled': return <RefilledTab data={refilledInquiries} />;
            case 'New Unit': return <NewUnitTab data={newUnitInquiries} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen pb-20 animate-in fade-in duration-700">
            {/* Top Bar */}
            {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pt-4">
                <div className="animate-in slide-in-from-left-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tighter uppercase italic">
                        Partner <span className="text-primary-500">Dashboard.</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-slate-500 font-bold text-sm tracking-wide">SYSTEM ONLINE - LATEST UPDATES AT 03:42 AM</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto animate-in slide-in-from-right-4 duration-700">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            placeholder="Search inquiries..."
                            className="bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-6 outline-none focus:ring-2 focus:ring-primary-500 shadow-soft w-full font-medium text-sm transition-all"
                        />
                    </div>
                    <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:text-primary-500 shadow-soft relative transition-all active:scale-95 group">
                        <Bell size={22} className="group-hover:rotate-12 transition-transform" />
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary-500 border-2 border-white rounded-full"></span>
                    </button>
                    <button className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-primary-600 transition-all active:scale-95 group">
                        <MessageSquare size={22} className="group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>
            </div> */}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12 animate-in slide-in-from-bottom-6 duration-700 delay-100">
                <StatCard icon={Layout} title="Total Active" value={stats.activeInquiries} color="bg-primary-500" subtitle="Inquiries" />
                <StatCard icon={Clock} title="Total Pending" value={stats.pendingInquiries} color="bg-amber-500" subtitle="Awaiting Action" />
                <StatCard icon={CheckCircle2} title="Total Closed" value={stats.closedInquiries} color="bg-emerald-500" subtitle="Past 30 Days" />
                <StatCard icon={DollarSign} title="Total Sales" value={`$${stats.totalSales.toLocaleString()}`} color="bg-indigo-500" subtitle="Gross Profit" />
                <StatCard icon={Users} title="Total Agents" value={stats.totalAgents} color="bg-pink-500" subtitle="Active Field Teams" />
            </div>

            {/* Main Application Area */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-1000 delay-200">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100/50">
                        {['Validation', 'Refilled', 'New Unit', 'Maintenance'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${activeTab === tab
                                    ? 'bg-white text-primary-500 shadow-soft-md'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                </div>

                <div className="p-8 min-h-[500px]">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default PartnerDashboard;

