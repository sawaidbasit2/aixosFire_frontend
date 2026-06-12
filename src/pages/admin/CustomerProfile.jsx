import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import PageLoader from '../../components/PageLoader';
import {
    ArrowLeft, Building, Mail, Phone, MapPin, Calendar,
    Activity, CheckCircle, MessageSquare, QrCode, Clock,
    FileText, AlertCircle
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';

const getBadgeClass = (s) => {
    const v = (s||'').toLowerCase();
    if (['completed','accepted','closed'].includes(v)) return 'bg-green-100 text-green-700';
    if (['rejected','cancelled'].includes(v)) return 'bg-red-100 text-red-700';
    if (['in progress','scheduled'].includes(v)) return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
};

const CustomerProfile = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState(null);
    const [inquiries, setInquiries] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [
                    { data: cData },
                    { data: iData },
                    { data: compData },
                ] = await Promise.all([
                    supabase.from('customers').select('*').eq('id', id).maybeSingle(),
                    supabase.from('inquiries')
                        .select('id,inquiry_no,type,status,created_at,follow_up_date,qr_code_value,agents(name),partners(name)')
                        .eq('customer_id', id)
                        .order('created_at', { ascending: false }),
                    supabase.from('complaints')
                        .select('id,message,is_admin,is_bot,is_read,created_at,status')
                        .eq('user_id', id)
                        .order('created_at', { ascending: false })
                        .limit(50),
                ]);
                setCustomer(cData);
                setInquiries(iData || []);
                setComplaints(compData || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const metrics = useMemo(() => {
        const totalServices = inquiries.length;
        const completed = inquiries.filter(i => ['completed','accepted','closed'].includes((i.status||'').toLowerCase())).length;
        const pending = inquiries.filter(i => !['completed','accepted','closed','rejected','cancelled'].includes((i.status||'').toLowerCase())).length;
        const qrVerified = inquiries.filter(i => i.qr_code_value).length;
        const openComplaints = complaints.filter(c => !c.is_admin && !c.is_read).length;
        return { totalServices, completed, pending, qrVerified, openComplaints };
    }, [inquiries, complaints]);

    // Must be before any early returns to satisfy Rules of Hooks
    const complaintThreads = useMemo(() => {
        const userMessages = complaints.filter(c => !c.is_admin);
        const adminReplies = complaints.filter(c => c.is_admin);
        return { userMessages, adminReplies, total: complaints.length };
    }, [complaints]);

    if (loading) return <PageLoader message="Loading customer profile..." />;
    if (!customer) return (
        <div className="text-center py-20">
            <Building size={48} className="mx-auto text-slate-200 mb-4"/>
            <p className="text-slate-500">Customer not found.</p>
            <Link to="/admin/customers" className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:underline">
                <ArrowLeft size={14}/> Back to Customers
            </Link>
        </div>
    );

    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'services', label: `Service History (${inquiries.length})` },
        { id: 'qr', label: `QR History (${inquiries.filter(i => i.qr_code_value).length})` },
        { id: 'complaints', label: `Complaints (${complaintThreads.total})` },
    ];

    return (
        <div className="space-y-6">
            <Link to="/admin/customers" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                <ArrowLeft size={16}/> Back to Customers
            </Link>

            {/* Profile Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                    <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0">
                        <Building size={28} className="text-sky-500"/>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-display font-bold text-slate-900">{customer.business_name}</h2>
                                <p className="text-sm text-slate-500 mt-0.5 capitalize">{customer.business_type || 'Business'}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                            }`}>{customer.status || 'Unknown'}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                            {customer.email && <span className="flex items-center gap-1.5"><Mail size={13}/>{customer.email}</span>}
                            {customer.phone && <span className="flex items-center gap-1.5"><Phone size={13}/>{customer.phone}</span>}
                            {customer.address && <span className="flex items-center gap-1.5"><MapPin size={13}/>{customer.address}</span>}
                            <span className="flex items-center gap-1.5"><Calendar size={13}/>Registered {new Date(customer.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={Activity}      title="Total Services"    value={metrics.totalServices}   color="bg-blue-500"/>
                <StatCard icon={CheckCircle}   title="Completed"         value={metrics.completed}       color="bg-emerald-500"/>
                <StatCard icon={Clock}         title="Pending"           value={metrics.pending}         color="bg-amber-500"/>
                <StatCard icon={QrCode}        title="QR Verified"       value={metrics.qrVerified}      color="bg-violet-500"/>
                <StatCard icon={MessageSquare} title="Unread Complaints" value={metrics.openComplaints}  color="bg-red-500"/>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-2xl p-1 w-fit shadow-sm">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Customer details card */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                        <h3 className="font-bold text-slate-900 mb-5">Customer Details</h3>
                        <div className="space-y-4">
                            {[
                                { icon: Building,  label: 'Business Name',  value: customer.business_name },
                                { icon: FileText,  label: 'Business Type',  value: customer.business_type || 'N/A' },
                                { icon: Mail,      label: 'Email',          value: customer.email || 'N/A' },
                                { icon: Phone,     label: 'Phone',          value: customer.phone || 'N/A' },
                                { icon: MapPin,    label: 'Address',        value: customer.address || 'N/A' },
                                { icon: Calendar,  label: 'Member Since',   value: new Date(customer.created_at).toLocaleDateString() },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-slate-50 flex-shrink-0">
                                        <Icon size={15} className="text-slate-400"/>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-400 font-semibold">{label}</p>
                                        <p className="text-sm text-slate-900 font-medium truncate">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                        <h3 className="font-bold text-slate-900 mb-5">Recent Activity</h3>
                        <div className="space-y-3">
                            {inquiries.slice(0, 6).map(inq => (
                                <div key={inq.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-slate-900 truncate">{inq.inquiry_no || `#${inq.id?.toString().slice(-6)}`}</p>
                                        <p className="text-xs text-slate-400">{inq.type || '—'} · {inq.agents?.name || 'Unassigned'}</p>
                                    </div>
                                    <span className={`ml-3 px-2 py-0.5 rounded-lg text-xs font-bold flex-shrink-0 ${getBadgeClass(inq.status)}`}>{inq.status||'Pending'}</span>
                                </div>
                            ))}
                            {inquiries.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No services yet.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Service History Tab */}
            {activeTab === 'services' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900">Complete Service History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-3">Inquiry No</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Agent</th>
                                    <th className="px-6 py-3">Partner</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {inquiries.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">No service history.</td></tr>}
                                {inquiries.map(inq => (
                                    <tr key={inq.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{inq.inquiry_no || `#${inq.id?.toString().slice(-6)}`}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 capitalize">{inq.type || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{inq.agents?.name || 'Unassigned'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{inq.partners?.name || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getBadgeClass(inq.status)}`}>{inq.status||'Pending'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">{new Date(inq.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* QR History Tab */}
            {activeTab === 'qr' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900">QR Verification History</h3>
                        <p className="text-xs text-slate-400 mt-1">All inquiries with QR verification data</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {inquiries.filter(i => i.qr_code_value).length === 0 && (
                            <div className="p-12 text-center">
                                <QrCode size={40} className="mx-auto text-slate-200 mb-3"/>
                                <p className="text-sm text-slate-400">No QR verifications recorded.</p>
                            </div>
                        )}
                        {inquiries.filter(i => i.qr_code_value).map(inq => (
                            <div key={inq.id} className="p-5 flex flex-col sm:flex-row items-start gap-4">
                                <div className="p-3 rounded-2xl bg-violet-50 flex-shrink-0">
                                    <QrCode size={24} className="text-violet-600"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <p className="font-bold text-slate-900">{inq.inquiry_no || `#${inq.id?.toString().slice(-6)}`}</p>
                                            <p className="text-xs text-slate-400 mt-0.5 break-all">{inq.qr_code_value}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getBadgeClass(inq.status)}`}>{inq.status||'Pending'}</span>
                                            <span className="text-xs text-slate-400">{new Date(inq.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Type: <span className="font-semibold capitalize">{inq.type}</span> · Agent: <span className="font-semibold">{inq.agents?.name || 'Unassigned'}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Complaints Tab */}
            {activeTab === 'complaints' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-900">Complaint History</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{complaintThreads.userMessages.length} messages from customer · {complaintThreads.adminReplies.length} admin/bot replies</p>
                        </div>
                        <Link to="/admin/complaints" className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
                            Open in Complaint Center →
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                        {complaints.length === 0 && (
                            <div className="p-12 text-center">
                                <MessageSquare size={40} className="mx-auto text-slate-200 mb-3"/>
                                <p className="text-sm text-slate-400">No complaints on record.</p>
                            </div>
                        )}
                        {complaints.map(c => (
                            <div key={c.id} className={`p-4 flex gap-3 ${c.is_admin ? 'bg-slate-50' : 'bg-white'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                    c.is_admin ? (c.is_bot ? 'bg-blue-100 text-blue-700' : 'bg-slate-800 text-white') : 'bg-primary-100 text-primary-700'
                                }`}>
                                    {c.is_admin ? (c.is_bot ? '🤖' : 'A') : 'C'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-700">
                                            {c.is_admin ? (c.is_bot ? 'AI Bot' : 'Admin') : 'Customer'}
                                        </span>
                                        <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">{c.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerProfile;
