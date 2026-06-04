import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import PageLoader from '../../components/PageLoader';
import { Link } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    Users, DollarSign, Activity, AlertCircle, CheckCircle,
    UserPlus, Handshake, BarChart2, ArrowRight, ArrowUpRight,
    MessageSquare, FileText
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';

const SERVICE_PRICING = { inspection: 50, refilling: 65, installation: 150, validation: 45, maintenance: 80 };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#ef4444','#f97316','#3b82f6','#10b981','#8b5cf6'];

const getBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (['completed','accepted','closed'].includes(s)) return 'bg-green-100 text-green-700';
    if (['rejected','cancelled'].includes(s)) return 'bg-red-100 text-red-700';
    if (['in progress','scheduled'].includes(s)) return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
};

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [
                    { count: totalAgents },
                    { count: activeAgents },
                    { count: totalCustomers },
                    { count: totalPartners },
                    { count: openComplaints },
                    { data: inquiries },
                    { data: recentInquiries },
                    { data: agentsData },
                ] = await Promise.all([
                    supabase.from('agents').select('*', { count: 'exact', head: true }),
                    supabase.from('agents').select('*', { count: 'exact', head: true }).or('status.ilike.accepted,status.ilike.active'),
                    supabase.from('customers').select('*', { count: 'exact', head: true }),
                    supabase.from('partners').select('*', { count: 'exact', head: true }),
                    supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('is_admin', false).eq('is_read', false),
                    supabase.from('inquiries').select('id,type,status,created_at,agent_id').order('created_at', { ascending: false }),
                    supabase.from('inquiries').select('id,inquiry_no,type,status,created_at,customers(business_name),agents(name)').order('created_at', { ascending: false }).limit(6),
                    supabase.from('agents').select('id,name').or('status.ilike.accepted,status.ilike.active'),
                ]);

                const list = inquiries || [];

                // Revenue estimate
                let totalRevenue = 0;
                const monthlyMap = {};
                list.forEach(i => {
                    const price = SERVICE_PRICING[(i.type||'').toLowerCase()] || 50;
                    if (['completed','accepted','closed'].includes((i.status||'').toLowerCase())) {
                        totalRevenue += price;
                    }
                    const d = new Date(i.created_at);
                    const key = MONTHS[d.getMonth()];
                    if (!monthlyMap[key]) monthlyMap[key] = { name: key, inquiries: 0, revenue: 0, month: d.getMonth() };
                    monthlyMap[key].inquiries += 1;
                    if (['completed','accepted','closed'].includes((i.status||'').toLowerCase())) {
                        monthlyMap[key].revenue += price;
                    }
                });
                const revenueChart = MONTHS
                    .map(m => monthlyMap[m] || null)
                    .filter(Boolean)
                    .slice(-6);

                // Inquiry by type
                const typeMap = {};
                list.forEach(i => {
                    const t = i.type || 'Unknown';
                    typeMap[t] = (typeMap[t] || 0) + 1;
                });
                const typeBreakdown = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

                // Completion ratio
                const completed = list.filter(i => ['completed','accepted','closed'].includes((i.status||'').toLowerCase())).length;
                const completionRate = list.length ? Math.round((completed / list.length) * 100) : 0;

                // Top agents by inquiry count
                const agentInquiryMap = {};
                list.forEach(i => {
                    if (i.agent_id) agentInquiryMap[i.agent_id] = (agentInquiryMap[i.agent_id] || 0) + 1;
                });
                const agentMap = {};
                (agentsData || []).forEach(a => { agentMap[a.id] = a.name; });
                const topAgents = Object.entries(agentInquiryMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([id, count]) => ({ name: agentMap[id] || 'Unknown', count, id }));

                setData({
                    totalAgents: totalAgents || 0,
                    activeAgents: activeAgents || 0,
                    totalCustomers: totalCustomers || 0,
                    totalPartners: totalPartners || 0,
                    openComplaints: openComplaints || 0,
                    totalInquiries: list.length,
                    completedInquiries: completed,
                    pendingInquiries: list.filter(i => !['completed','accepted','closed','rejected'].includes((i.status||'').toLowerCase())).length,
                    totalRevenue,
                    completionRate,
                    revenueChart,
                    typeBreakdown,
                    topAgents,
                    recentInquiries: recentInquiries || [],
                });
            } catch (err) {
                console.error('Dashboard load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <PageLoader message="Loading dashboard..." />;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Admin Panel</p>
                    <h1 className="text-2xl font-display font-bold text-slate-900">Business Overview</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Real-time platform performance and operational metrics.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/admin/analytics" className="btn-outline text-sm py-2 px-4 flex items-center gap-2">
                        <BarChart2 size={16} /> Analytics
                    </Link>
                    <Link to="/admin/reports" className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                        <FileText size={16} /> Reports
                    </Link>
                </div>
            </div>

            {/* KPI Row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={DollarSign}  title="Total Revenue"   value={`SAR ${(data?.totalRevenue||0).toLocaleString()}`} color="bg-emerald-500" trend={12} subtext="From completed services" />
                <StatCard icon={Activity}    title="Total Inquiries" value={data?.totalInquiries||0}  color="bg-blue-500"    trend={8}  subtext={`${data?.pendingInquiries||0} pending`} />
                <StatCard icon={Users}       title="Active Agents"   value={data?.activeAgents||0}    color="bg-violet-500"  subtext={`${data?.totalAgents||0} total registered`} />
                <StatCard icon={AlertCircle} title="Open Complaints" value={data?.openComplaints||0}  color="bg-red-500"     subtext="Unread threads" />
            </div>

            {/* KPI Row 2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={UserPlus}    title="Total Customers" value={data?.totalCustomers||0}  color="bg-sky-500"    trend={5} subtext="Registered businesses" />
                <StatCard icon={Handshake}   title="Total Partners"  value={data?.totalPartners||0}   color="bg-orange-500" subtext="Service partners" />
                <StatCard icon={CheckCircle} title="Completed"       value={data?.completedInquiries||0} color="bg-teal-500" subtext="All time completions" />
                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6 flex flex-col justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Completion Rate</p>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 mb-2">{data?.completionRate||0}%</p>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-700" style={{ width: `${data?.completionRate||0}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-slate-900">Revenue & Inquiry Trends</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Last 6 months overview</p>
                        </div>
                        <Link to="/admin/analytics" className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
                            Full Analytics <ArrowUpRight size={13} />
                        </Link>
                    </div>
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.revenueChart || []}>
                                <defs>
                                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="gInq" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill:'#94a3b8', fontSize:12 }}/>
                                <YAxis axisLine={false} tickLine={false} tick={{ fill:'#94a3b8', fontSize:12 }}/>
                                <Tooltip contentStyle={{ borderRadius:'12px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)' }}/>
                                <Area type="monotone" dataKey="revenue" name="Revenue (SAR)" stroke="#10b981" strokeWidth={2.5} fill="url(#gRev)"/>
                                <Area type="monotone" dataKey="inquiries" name="Inquiries" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gInq)"/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                    <h3 className="font-bold text-slate-900 mb-1">Service Breakdown</h3>
                    <p className="text-xs text-slate-400 mb-4">Inquiries by type</p>
                    {(data?.typeBreakdown||[]).length > 0 ? (
                        <>
                            <div className="h-[170px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={data?.typeBreakdown||[]} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                                            {(data?.typeBreakdown||[]).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius:'10px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)' }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 mt-3">
                                {(data?.typeBreakdown||[]).slice(0,4).map((item, i) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}/>
                                            <span className="text-slate-600 capitalize text-xs">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-slate-900 text-sm">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[200px] text-slate-300">
                            <Activity size={32} className="mb-2"/>
                            <p className="text-sm">No data yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Top Agents + Recent Inquiries */}
            <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-slate-900">Top Agents</h3>
                        <Link to="/admin/analytics" className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
                            Full Leaderboard <ArrowRight size={12}/>
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {(data?.topAgents||[]).length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-6">No agent data available.</p>
                        )}
                        {(data?.topAgents||[]).map((agent, i) => (
                            <Link key={agent.id} to={`/admin/agents/${agent.id}`} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-600'
                                }`}>{i + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">{agent.name}</p>
                                    <p className="text-xs text-slate-400">{agent.count} inquiries</p>
                                </div>
                                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors"/>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-slate-900">Recent Inquiries</h3>
                        <Link to="/admin/services" className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
                            View all <ArrowRight size={12}/>
                        </Link>
                    </div>
                    <div className="space-y-1">
                        {(data?.recentInquiries||[]).map(inq => (
                            <div key={inq.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-900 truncate">{inq.inquiry_no || `#${inq.id?.toString().slice(-6)}`}</p>
                                    <p className="text-xs text-slate-400 truncate">{inq.customers?.business_name || '—'} · {inq.agents?.name || 'Unassigned'}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                    <span className="text-xs font-semibold text-slate-400 capitalize hidden sm:block">{inq.type||'—'}</span>
                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${getBadgeClass(inq.status)}`}>{inq.status||'Pending'}</span>
                                </div>
                            </div>
                        ))}
                        {(!data?.recentInquiries?.length) && (
                            <p className="text-sm text-slate-400 text-center py-6">No inquiries found.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Nav */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                    { label:'Analytics',   to:'/admin/analytics',  icon:BarChart2,     bg:'bg-blue-50',    text:'text-blue-600' },
                    { label:'Agents',      to:'/admin/agents',     icon:Users,         bg:'bg-violet-50',  text:'text-violet-600' },
                    { label:'Partners',    to:'/admin/partners',   icon:Handshake,     bg:'bg-orange-50',  text:'text-orange-600' },
                    { label:'Customers',   to:'/admin/customers',  icon:UserPlus,      bg:'bg-sky-50',     text:'text-sky-600' },
                    { label:'Operations',  to:'/admin/operations', icon:Activity,      bg:'bg-teal-50',    text:'text-teal-600' },
                    { label:'Complaints',  to:'/admin/complaints', icon:MessageSquare, bg:'bg-red-50',     text:'text-red-600' },
                ].map(({ label, to, icon: Icon, bg, text }) => (
                    <Link key={to} to={to} className={`${bg} rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-sm transition-all`}>
                        <Icon size={20} className={text} />
                        <p className={`text-xs font-bold ${text}`}>{label}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
