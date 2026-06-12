import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import PageLoader from '../../components/PageLoader';
import {
    ArrowLeft, FileText, User, Briefcase, Handshake,
    Calendar, CheckCircle, Clock, XCircle, Activity,
    MapPin, Mail, Phone, DollarSign, Tag, AlertCircle,
    QrCode, Package, ChevronRight, Hash
} from 'lucide-react';

const SERVICE_PRICING = {
    inspection: 50, refilling: 65, installation: 150,
    validation: 45, maintenance: 80,
};

const getBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (['completed','accepted','closed'].includes(s)) return 'bg-green-100 text-green-700';
    if (['rejected','cancelled'].includes(s)) return 'bg-red-100 text-red-700';
    if (['in progress','scheduled'].includes(s)) return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
};

const getPriorityClass = (priority) => {
    if (priority === 'High')   return 'bg-red-100 text-red-700';
    if (priority === 'Medium') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
};

const InfoRow = ({ icon: Icon, label, value, valueClass = 'text-slate-900' }) => (
    <div className="flex items-start gap-3 py-2.5">
        <div className="p-2 rounded-xl bg-slate-50 flex-shrink-0 mt-0.5">
            <Icon size={14} className="text-slate-400" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-semibold">{label}</p>
            <p className={`text-sm font-medium mt-0.5 break-words ${valueClass}`}>{value || '—'}</p>
        </div>
    </div>
);

const TimelineEvent = ({ icon: Icon, color, label, date, last }) => (
    <div className="flex gap-4">
        <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={16} className="text-white" />
            </div>
            {!last && <div className="w-0.5 bg-slate-100 flex-1 mt-1" />}
        </div>
        <div className="pb-6 flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">{label}</p>
            {date && (
                <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(date).toLocaleString()}
                </p>
            )}
        </div>
    </div>
);

const InquiryDetail = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [inquiry, setInquiry] = useState(null);
    const [items, setItems]     = useState([]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Fetch base inquiry first
                const { data: inqData, error: inqErr } = await supabase
                    .from('inquiries')
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();

                if (inqErr) throw inqErr;
                if (!inqData) { setLoading(false); return; }

                // Fetch related records in parallel using IDs from the inquiry
                const [customerRes, agentRes, partnerRes, itemsRes] = await Promise.allSettled([
                    inqData.customer_id
                        ? supabase.from('customers').select('*').eq('id', inqData.customer_id).maybeSingle()
                        : Promise.resolve({ data: null }),
                    inqData.agent_id
                        ? supabase.from('agents').select('*').eq('id', inqData.agent_id).maybeSingle()
                        : Promise.resolve({ data: null }),
                    inqData.partner_id
                        ? supabase.from('partners').select('*').eq('id', inqData.partner_id).maybeSingle()
                        : Promise.resolve({ data: null }),
                    supabase.from('inquiry_items').select('*').eq('inquiry_id', id).order('created_at', { ascending: true }),
                ]);

                const enriched = {
                    ...inqData,
                    customers: customerRes.status === 'fulfilled' ? customerRes.value?.data ?? null : null,
                    agents:    agentRes.status    === 'fulfilled' ? agentRes.value?.data    ?? null : null,
                    partners:  partnerRes.status  === 'fulfilled' ? partnerRes.value?.data  ?? null : null,
                };

                setInquiry(enriched);
                setItems(itemsRes.status === 'fulfilled' ? itemsRes.value?.data || [] : []);
            } catch (err) {
                console.error('InquiryDetail load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const estimatedRevenue = useMemo(() => {
        if (!inquiry) return 0;
        return SERVICE_PRICING[(inquiry.type || '').toLowerCase()] || 50;
    }, [inquiry]);

    const timeline = useMemo(() => {
        if (!inquiry) return [];
        const events = [];

        events.push({
            icon: FileText,
            color: 'bg-blue-500',
            label: 'Inquiry Created',
            date: inquiry.created_at,
        });

        if (inquiry.follow_up_date) {
            events.push({
                icon: Calendar,
                color: 'bg-violet-500',
                label: 'Follow-up / Assignment Scheduled',
                date: inquiry.follow_up_date,
            });
        }

        const s = (inquiry.status || '').toLowerCase();
        if (['in progress'].includes(s)) {
            events.push({
                icon: Activity,
                color: 'bg-amber-500',
                label: 'Work In Progress',
                date: inquiry.updated_at || null,
            });
        } else if (['completed','accepted','closed'].includes(s)) {
            events.push({
                icon: CheckCircle,
                color: 'bg-emerald-500',
                label: 'Inquiry Completed',
                date: inquiry.updated_at || inquiry.follow_up_date || null,
            });
        } else if (['rejected','cancelled'].includes(s)) {
            events.push({
                icon: XCircle,
                color: 'bg-red-500',
                label: `Inquiry ${s.charAt(0).toUpperCase() + s.slice(1)}`,
                date: inquiry.updated_at || null,
            });
        }

        return events;
    }, [inquiry]);

    if (loading) return <PageLoader message="Loading inquiry details…" />;

    if (!inquiry) return (
        <div className="text-center py-20">
            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500">Inquiry not found.</p>
            <Link to="/admin/inquiries" className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:underline text-sm">
                <ArrowLeft size={14} /> Back to Inquiries
            </Link>
        </div>
    );

    const isCompleted = ['completed','accepted','closed'].includes((inquiry.status||'').toLowerCase());

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Back */}
            <Link
                to="/admin/inquiries"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Inquiries
            </Link>

            {/* Header card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex-shrink-0">
                            <FileText size={28} className="text-blue-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-xl font-display font-bold text-slate-900">
                                    {inquiry.inquiry_no || `#${inquiry.id?.toString().slice(-8)}`}
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getBadgeClass(inquiry.status)}`}>
                                    {inquiry.status || 'Pending'}
                                </span>
                                {inquiry.priority && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityClass(inquiry.priority)}`}>
                                        {inquiry.priority} Priority
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5 capitalize">
                                    <Tag size={13} /> {inquiry.type || '—'} service
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={13} /> Created {new Date(inquiry.created_at).toLocaleDateString()}
                                </span>
                                {inquiry.inquiry_no && (
                                    <span className="flex items-center gap-1.5 font-mono text-xs">
                                        <Hash size={13} /> {inquiry.id?.toString().slice(-8)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Revenue badge */}
                    <div className="flex-shrink-0 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-right">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Est. Revenue</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">
                            SAR {isCompleted ? estimatedRevenue.toLocaleString() : '—'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isCompleted ? 'Earned' : `SAR ${estimatedRevenue} on completion`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main 3-col info grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Customer */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-sky-50">
                            <User size={16} className="text-sky-600" />
                        </div>
                        <h3 className="font-bold text-slate-900">Customer</h3>
                        {inquiry.customers?.id && (
                            <Link
                                to={`/admin/customers/${inquiry.customers.id}`}
                                className="ml-auto text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                            >
                                Profile <ChevronRight size={12} />
                            </Link>
                        )}
                    </div>
                    {inquiry.customers ? (
                        <div className="divide-y divide-slate-50">
                            <InfoRow icon={User}    label="Business Name"  value={inquiry.customers.business_name} />
                            <InfoRow icon={Tag}     label="Business Type"  value={inquiry.customers.business_type} />
                            <InfoRow icon={Mail}    label="Email"          value={inquiry.customers.email} />
                            <InfoRow icon={Phone}   label="Phone"          value={inquiry.customers.phone} />
                            <InfoRow icon={MapPin}  label="Address"        value={inquiry.customers.address} />
                            <InfoRow icon={CheckCircle} label="Status" value={inquiry.customers.status}
                                valueClass={inquiry.customers.status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 py-4 text-center">No customer data.</p>
                    )}
                </div>

                {/* Agent */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-violet-50">
                            <Briefcase size={16} className="text-violet-600" />
                        </div>
                        <h3 className="font-bold text-slate-900">Agent</h3>
                        {inquiry.agents?.id && (
                            <Link
                                to={`/admin/agents/${inquiry.agents.id}`}
                                className="ml-auto text-xs font-bold text-violet-600 hover:underline flex items-center gap-1"
                            >
                                Profile <ChevronRight size={12} />
                            </Link>
                        )}
                    </div>
                    {inquiry.agents ? (
                        <div className="divide-y divide-slate-50">
                            <InfoRow icon={User}     label="Agent Name"   value={inquiry.agents.name} />
                            <InfoRow icon={Mail}     label="Email"        value={inquiry.agents.email} />
                            <InfoRow icon={Phone}    label="Phone"        value={inquiry.agents.phone} />
                            <InfoRow icon={MapPin}   label="Territory"    value={inquiry.agents.territory} />
                            <InfoRow icon={CheckCircle} label="Status"   value={inquiry.agents.status}
                                valueClass={['accepted','active'].includes((inquiry.agents.status||'').toLowerCase()) ? 'text-emerald-600' : 'text-amber-600'}
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 py-4 text-center">No agent assigned.</p>
                    )}
                </div>

                {/* Partner */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-orange-50">
                            <Handshake size={16} className="text-orange-600" />
                        </div>
                        <h3 className="font-bold text-slate-900">Partner</h3>
                        {inquiry.partners?.id && (
                            <Link
                                to={`/admin/partners/${inquiry.partners.id}`}
                                className="ml-auto text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                            >
                                Profile <ChevronRight size={12} />
                            </Link>
                        )}
                    </div>
                    {inquiry.partners ? (
                        <div className="divide-y divide-slate-50">
                            <InfoRow icon={Handshake} label="Partner Name" value={inquiry.partners.name} />
                            <InfoRow icon={Mail}      label="Email"        value={inquiry.partners.email} />
                            <InfoRow icon={Phone}     label="Phone"        value={inquiry.partners.phone} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                            <Handshake size={28} className="mb-2" />
                            <p className="text-sm text-slate-400">No partner assigned.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Inquiry details + Timeline side by side */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Inquiry Details */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Inquiry Details</h3>
                    <div className="divide-y divide-slate-50">
                        <InfoRow icon={Hash}         label="Inquiry ID"       value={inquiry.id} valueClass="font-mono text-xs text-slate-600" />
                        <InfoRow icon={Tag}          label="Inquiry Type"     value={inquiry.type} valueClass="capitalize" />
                        <InfoRow icon={Activity}     label="Status"           value={inquiry.status} />
                        <InfoRow icon={AlertCircle}  label="Priority"         value={inquiry.priority} />
                        <InfoRow icon={Calendar}     label="Created Date"     value={inquiry.created_at ? new Date(inquiry.created_at).toLocaleString() : null} />
                        <InfoRow icon={Clock}        label="Follow-up Date"   value={inquiry.follow_up_date ? new Date(inquiry.follow_up_date).toLocaleString() : null} />
                        {inquiry.updated_at && (
                            <InfoRow icon={CheckCircle} label="Last Updated"  value={new Date(inquiry.updated_at).toLocaleString()} />
                        )}
                    </div>
                </div>

                {/* Revenue + QR + Timeline */}
                <div className="space-y-6">
                    {/* Revenue / Pricing */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-emerald-50">
                                <DollarSign size={16} className="text-emerald-600" />
                            </div>
                            <h3 className="font-bold text-slate-900">Revenue &amp; Pricing</h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                            <InfoRow icon={Tag}        label="Service Type"        value={inquiry.type} valueClass="capitalize" />
                            <InfoRow icon={DollarSign} label="Estimated Price"     value={`SAR ${estimatedRevenue}`} valueClass="font-bold text-emerald-700" />
                            <InfoRow icon={CheckCircle} label="Revenue Realized"   value={isCompleted ? `SAR ${estimatedRevenue}` : 'Pending completion'} valueClass={isCompleted ? 'text-emerald-600 font-bold' : 'text-amber-600'} />
                        </div>
                    </div>

                    {/* QR Code */}
                    {inquiry.qr_code_value && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-xl bg-violet-50">
                                    <QrCode size={16} className="text-violet-600" />
                                </div>
                                <h3 className="font-bold text-slate-900">QR Information</h3>
                            </div>
                            <p className="text-xs text-slate-400 font-semibold mb-1">QR Code Value</p>
                            <p className="text-sm font-mono text-slate-700 bg-slate-50 rounded-xl px-3 py-2 break-all">
                                {inquiry.qr_code_value}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                <h3 className="font-bold text-slate-900 mb-6">Inquiry Timeline</h3>
                <div className="space-y-0">
                    {timeline.map((event, i) => (
                        <TimelineEvent
                            key={i}
                            icon={event.icon}
                            color={event.color}
                            label={event.label}
                            date={event.date}
                            last={i === timeline.length - 1}
                        />
                    ))}
                </div>
            </div>

            {/* Inquiry Items */}
            {items.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-50">
                            <Package size={16} className="text-slate-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Inquiry Items</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/70 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                                    <th className="px-6 py-3">#</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Quantity</th>
                                    <th className="px-6 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                                            {item.description || item.name || item.item_type || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 capitalize">
                                            {item.type || item.item_type || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.status ? (
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getBadgeClass(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            ) : <span className="text-xs text-slate-300">—</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.quantity ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-400">
                                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Progress indicator */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                <h3 className="font-bold text-slate-900 mb-4">Current Progress</h3>
                <div className="flex items-center gap-3">
                    {[
                        { label: 'Created',     done: true },
                        { label: 'Assigned',    done: !!inquiry.agents },
                        { label: 'In Progress', done: ['in progress','scheduled','completed','accepted','closed'].includes((inquiry.status||'').toLowerCase()) },
                        { label: 'Completed',   done: ['completed','accepted','closed'].includes((inquiry.status||'').toLowerCase()) },
                    ].map((step, i, arr) => (
                        <React.Fragment key={step.label}>
                            <div className="flex flex-col items-center gap-1.5 flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                    step.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {step.done ? <CheckCircle size={16} /> : i + 1}
                                </div>
                                <p className={`text-xs font-semibold text-center leading-tight ${step.done ? 'text-emerald-700' : 'text-slate-400'}`}>
                                    {step.label}
                                </p>
                            </div>
                            {i < arr.length - 1 && (
                                <div className={`h-0.5 flex-1 rounded-full mb-5 transition-all ${step.done ? 'bg-emerald-300' : 'bg-slate-100'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InquiryDetail;
