import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import PageLoader from '../../components/PageLoader';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
    ArrowLeft, User, Phone, MapPin, Mail, Calendar, CheckCircle,
    Clock, XCircle, TrendingUp, Activity, FileText, AlertTriangle,
    Award, ChevronRight
} from 'lucide-react';
import PerformanceBadge from '../../components/admin/PerformanceBadge';
import StatCard from '../../components/admin/StatCard';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const getBadgeClass = (s) => {
    const v = (s||'').toLowerCase();
    if (['completed','accepted','closed'].includes(v)) return 'bg-green-100 text-green-700';
    if (['rejected','cancelled'].includes(v)) return 'bg-red-100 text-red-700';
    if (['in progress','scheduled'].includes(v)) return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
};

const AgentProfile = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [agent, setAgent] = useState(null);
    const [inquiries, setInquiries] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [
                    { data: agentData },
                    { data: inqData },
                ] = await Promise.all([
                    supabase.from('agents').select('*').eq('id', id).maybeSingle(),
                    supabase.from('inquiries')
                        .select('id,inquiry_no,type,status,created_at,follow_up_date,customers(business_name,address)')
                        .eq('agent_id', id)
                        .order('created_at', { ascending: false }),
                ]);
                setAgent(agentData);
                setInquiries(inqData || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const metrics = useMemo(() => {
        const total = inquiries.length;
        const completed = inquiries.filter(i => ['completed','accepted','closed'].includes((i.status||'').toLowerCase())).length;
        const pending = inquiries.filter(i => !['completed','accepted','closed','rejected','cancelled'].includes((i.status||'').toLowerCase())).length;
        const rejected = inquiries.filter(i => ['rejected','cancelled'].includes((i.status||'').toLowerCase())).length;
        const score = total ? Math.round((completed / total) * 100) : 0;

        // Today's activity
        const today = new Date().toISOString().split('T')[0];
        const todayCount = inquiries.filter(i => i.created_at?.split('T')[0] === today).length;

        // Monthly trend
        const monthMap = {};
        inquiries.forEach(i => {
            const d = new Date(i.created_at);
            const key = MONTHS[d.getMonth()];
            if (!monthMap[key]) monthMap[key] = { name: key, total: 0, completed: 0 };
            monthMap[key].total += 1;
            if (['completed','accepted','closed'].includes((i.status||'').toLowerCase())) monthMap[key].completed += 1;
        });
        const trendData = MONTHS.filter(m => monthMap[m]).map(m => monthMap[m]);

        // Type breakdown
        const typeMap = {};
        inquiries.forEach(i => { const t = i.type||'Unknown'; typeMap[t] = (typeMap[t]||0)+1; });
        const typeData = Object.entries(typeMap).map(([name, count]) => ({ name, count }));

        return { total, completed, pending, rejected, score, todayCount, trendData, typeData };
    }, [inquiries]);

    if (loading) return <PageLoader message="Loading agent profile..." />;
    if (!agent) return (
        <div className="text-center py-20">
            <User size={48} className="mx-auto text-slate-200 mb-4"/>
            <p className="text-slate-500">Agent not found.</p>
            <Link to="/admin/agents" className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:underline">
                <ArrowLeft size={14}/> Back to Agents
            </Link>
        </div>
    );

    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'inquiries', label: `Inquiries (${metrics.total})` },
        { id: 'timeline', label: 'Activity Timeline' },
    ];

    return (
        <div className="space-y-6">
            {/* Back */}
            <Link to="/admin/agents" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                <ArrowLeft size={16}/> Back to Agent Management
            </Link>

            {/* Profile Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                        {agent.profile_photo
                            ? <img src={agent.profile_photo} alt={agent.name} className="w-full h-full object-cover"/>
                            : <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={32}/></div>
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-display font-bold text-slate-900">{agent.name}</h2>
                                <p className="text-sm text-slate-500 mt-0.5">{agent.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <PerformanceBadge score={metrics.score}/>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    ['accepted','active'].includes((agent.status||'').toLowerCase()) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                }`}>{agent.status || 'Unknown'}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                            {agent.phone && <span className="flex items-center gap-1.5"><Phone size={14}/>{agent.phone}</span>}
                            {agent.territory && <span className="flex items-center gap-1.5"><MapPin size={14}/>{agent.territory}</span>}
                            <span className="flex items-center gap-1.5"><Calendar size={14}/>Joined {new Date(agent.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={Activity}    title="Total Assigned"  value={metrics.total}     color="bg-blue-500"    />
                <StatCard icon={CheckCircle} title="Completed"       value={metrics.completed}  color="bg-emerald-500" />
                <StatCard icon={Clock}       title="Pending"         value={metrics.pending}    color="bg-amber-500"   />
                <StatCard icon={XCircle}     title="Rejected"        value={metrics.rejected}   color="bg-red-500"     />
                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Performance</p>
                    <p className="text-2xl font-bold text-slate-900 mb-2">{metrics.score}%</p>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${metrics.score}%` }}/>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 w-fit shadow-sm">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === t.id ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                        <h3 className="font-bold text-slate-900 mb-5">Monthly Activity</h3>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics.trendData}>
                                    <defs>
                                        <linearGradient id="gAgt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill:'#94a3b8', fontSize:11 }}/>
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill:'#94a3b8', fontSize:11 }}/>
                                    <Tooltip contentStyle={{ borderRadius:'12px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)' }}/>
                                    <Area type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gAgt)"/>
                                    <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} fillOpacity={0}/>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                        <h3 className="font-bold text-slate-900 mb-5">Inquiries by Type</h3>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.typeData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill:'#94a3b8', fontSize:11 }}/>
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:11 }} width={90}/>
                                    <Tooltip contentStyle={{ borderRadius:'12px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)' }}/>
                                    <Bar dataKey="count" fill="#3b82f6" radius={[0,4,4,0]}/>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Inquiries Tab */}
            {activeTab === 'inquiries' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900">All Assigned Inquiries</h3>
                        <div className="flex gap-2">
                            {['All','Pending','Completed','Rejected'].map(f => (
                                <button key={f} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition-colors">{f}</button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-3">Inquiry No</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Due Date</th>
                                    <th className="px-6 py-3">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {inquiries.length === 0 && (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">No inquiries found.</td></tr>
                                )}
                                {inquiries.map(inq => (
                                    <tr key={inq.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{inq.inquiry_no || `#${inq.id?.toString().slice(-6)}`}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{inq.customers?.business_name || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 capitalize">{inq.type || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getBadgeClass(inq.status)}`}>{inq.status||'Pending'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {inq.follow_up_date ? new Date(inq.follow_up_date).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">{new Date(inq.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                    <h3 className="font-bold text-slate-900 mb-6">Activity Timeline</h3>
                    <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100"/>
                        <div className="space-y-4">
                            {inquiries.slice(0, 20).map((inq, i) => (
                                <div key={inq.id} className="flex gap-4 pl-10 relative">
                                    <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white top-1.5 ${
                                        ['completed','accepted','closed'].includes((inq.status||'').toLowerCase()) ? 'bg-emerald-500' :
                                        ['rejected','cancelled'].includes((inq.status||'').toLowerCase()) ? 'bg-red-500' : 'bg-blue-500'
                                    }`}/>
                                    <div className="flex-1 bg-slate-50 rounded-2xl p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{inq.inquiry_no || `Inquiry #${inq.id?.toString().slice(-6)}`}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{inq.customers?.business_name || '—'} · {inq.type || '—'}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${getBadgeClass(inq.status)}`}>{inq.status||'Pending'}</span>
                                                <span className="text-xs text-slate-400">{new Date(inq.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {inquiries.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No activities recorded.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentProfile;
