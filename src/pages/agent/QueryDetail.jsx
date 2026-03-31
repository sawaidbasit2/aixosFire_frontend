import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
    ArrowLeft,
    Calendar,
    User,
    Mail,
    FireExtinguisher,
    Scale,
    Box,
    Activity,
    DollarSign,
    Info,
    ChevronRight,
    ShieldCheck,
    FileText,
    ArrowRight,
    Building2
} from 'lucide-react';
import PageLoader from '../../components/PageLoader';

const QueryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [query, setQuery] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQueryDetail = async () => {
            setLoading(true);
            try {
                const { data: inquiryData, error: inquiryError } = await supabase
                    .from('inquiries')
                    .select(`
                        *,
                        visits (
                            visit_date,
                            agent_id
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (inquiryError) throw inquiryError;

                const { data: itemsData, error: itemsError } = await supabase
                    .from('inquiry_items')
                    .select('*')
                    .eq('inquiry_id', id);

                if (itemsError) throw itemsError;

                const allItems = itemsData || [];
                const sortedItems = [...allItems].sort((a,b) => (a.serial_no || 0) - (b.serial_no || 0));

                const primaryQuery = {
                    ...inquiryData,
                    inquiry_items: sortedItems
                };

                setQuery(primaryQuery);

                // Fetch Customer Details
                if (inquiryData.customer_id) {
                    const { data: customerData, error: customerError } = await supabase
                        .from('customers')
                        .select('*')
                        .eq('id', inquiryData.customer_id)
                        .single();

                    if (!customerError) {
                        setCustomer(customerData);
                    }
                }

                // Fetch Agent details (Assuming a 'profiles' or 'users' table exists)
                // If agent_id is available, we'll try to get their details
                if (inquiryData?.agent_id) {
                    const { data: agentData, error: agentError } = await supabase
                        .from('agents')
                        .select('name, email')
                        .eq('id', inquiryData.agent_id)
                        .single();

                    if (!agentError) {
                        primaryQuery.agent = agentData;
                        setQuery({ ...primaryQuery });
                    }
                }

            } catch (err) {
                console.error('Error fetching query detail:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchQueryDetail();
    }, [id]);

    const formatDate = (date) =>
        date ? new Date(date).toLocaleDateString() : 'N/A';
    const primaryItem = query?.inquiry_items?.[0] || null;

    if (loading) return <PageLoader message="Loading query details..." />;
    if (!query) return (
        <div className="p-10 text-center">
            <p className="text-slate-500 mb-4">Query not found</p>
            <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Go Back</button>
        </div>
    );

    return (
        <div className="mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {query.inquiry_no || query.type || 'Query Details'}
                        </h1>
                        <p className="text-sm text-slate-500">
                            ID: #{query.id} {query.serial_no ? `| Item #${query.serial_no}` : ''}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${(query.status || '').toLowerCase() === 'completed' || (query.status || '').toLowerCase() === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {query.status || 'Pending'}
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${(primaryItem?.query_status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {primaryItem?.query_status || 'Active'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-8">
                    {/* Items List */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-900">Inquiry Items ({query.inquiry_items?.length || 0})</h2>
                        {query.inquiry_items?.map((item) => (
                            <section key={item.id} className="bg-white rounded-2xl border p-6 space-y-6">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                                            {item.serial_no}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-slate-900">{item.system_type || item.type || 'Standard Equipment'}</h2>
                                            {item.system_type && <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{item.type}</p>}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                        item.status === 'New' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {item.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <DetailItem icon={<Scale />} label="Capacity" value={item.capacity} />
                                    <DetailItem icon={<Box />} label="Quantity" value={`${item.quantity} ${item.unit || 'Pieces'}`} />
                                    <DetailItem icon={<DollarSign />} label="Price" value={item.price ? `SAR ${item.price}` : 'N/A'} />
                                    <DetailItem icon={<ShieldCheck />} label="Catalog No" value={item.catalog_no} />
                                    <DetailItem icon={<Activity />} label="Condition" value={item.condition} />
                                    <DetailItem icon={<FileText />} label="System" value={item.firefighting_system} />
                                </div>
                                {item.maintenance_notes && (
                                    <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-slate-300">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                                        <p className="text-sm text-slate-600 leading-relaxed">{item.maintenance_notes}</p>
                                    </div>
                                )}
                                {(item.maintenance_unit_photo_url || item.maintenance_voice_url) && (
                                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                                        {item.maintenance_unit_photo_url && (
                                            <MediaItem title="Item Photo" url={item.maintenance_unit_photo_url} type="image" />
                                        )}
                                        {item.maintenance_voice_url && (
                                            <MediaItem title="Voice Note" url={item.maintenance_voice_url} type="audio" />
                                        )}
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>

                    {/* Maintenance Records */}
                    <section className="bg-white rounded-2xl border p-6 space-y-6">
                        <div className="flex items-center gap-2 border-b pb-4">
                            <FileText className="text-purple-600" size={20} />
                            <h2 className="font-bold text-slate-900">Maintenance Details</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <DetailItem label="Fire Fighting System" value={primaryItem?.firefighting_system} />
                            <DetailItem label="Fire Alarm System" value={primaryItem?.fire_alarm_system} />
                            <DetailItem label="Pump Type" value={primaryItem?.pump_type} />
                            <DetailItem label="Install Date" value={formatDate(primaryItem?.install_date)} />
                            <DetailItem label="Last Refill" value={formatDate(primaryItem?.last_refill_date)} />
                            <DetailItem label="Expiry Date" value={formatDate(primaryItem?.expiry_date)} />
                        </div>
                        {primaryItem?.maintenance_notes && (
                            <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-slate-300">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                                <p className="text-sm text-slate-600 leading-relaxed">{primaryItem.maintenance_notes}</p>
                            </div>
                        )}
                    </section>

                    {/* Media Section */}
                    {(primaryItem?.extinguisher_photo || primaryItem?.maintenance_unit_photo_url || primaryItem?.maintenance_voice_url) && (
                        <section className="bg-white rounded-2xl border p-6 space-y-6">
                            <h2 className="font-bold text-slate-900">Attached Media</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {primaryItem?.extinguisher_photo && (
                                    <MediaItem title="Equipment Photo" url={primaryItem.extinguisher_photo} type="image" />
                                )}
                                {primaryItem?.maintenance_unit_photo_url && (
                                    <MediaItem title="Maintenance Photo" url={primaryItem.maintenance_unit_photo_url} type="image" />
                                )}
                                {primaryItem?.maintenance_voice_url && (
                                    <MediaItem title="Voice Note" url={primaryItem.maintenance_voice_url} type="audio" />
                                )}
                            </div>
                        </section>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    {/* Customer Information */}
                    <section className="bg-white rounded-2xl border p-6 space-y-6 relative overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                                <Building2 className="text-blue-400" size={20} />
                                <h2 className="font-bold">Customer Info</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Customer Name</p>
                                    <p className="font-bold text-lg">{customer?.business_name || 'System Customer'}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Customer Email</p>
                                    <button
                                        onClick={() => navigate(`/agent/customer/${query.customer_id}`)}
                                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium group"
                                    >
                                        <Mail size={16} />
                                        <span className="underline decoration-blue-800 underline-offset-4">{customer?.email || 'customer@aixos.com'}</span>
                                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>

                                {query.agent?.name && (
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Generated By Agent</p>
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <User size={14} className="text-slate-500" />
                                            <span className="text-sm font-medium">{query.agent.name}</span>
                                        </div>
                                    </div>
                                )}

                                {query.visits?.visit_date && (
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Visit Date</p>
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <Calendar size={14} className="text-slate-500" />
                                            <span className="text-sm font-medium">{formatDate(query.visits.visit_date)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Visual Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    </section>

                    {/* Quick Support */}
                    <section className="bg-white rounded-2xl border p-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Info size={24} />
                        </div>
                        <h3 className="font-bold text-slate-900 leading-tight">Need assistance with this query?</h3>
                        <p className="text-xs text-slate-500">Contact our support center or view related customer history.</p>
                        <button
                            onClick={() => navigate(`/agent/customer/${query.customer_id}`)}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                        >
                            <span>Back to Customer</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ icon, label, value }) => (
    <div className="flex gap-3">
        {icon && <div className="text-slate-400">{icon}</div>}
        <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{label}</p>
            <p className="text-sm font-semibold text-slate-700">{value || 'N/A'}</p>
        </div>
    </div>
);

const MediaItem = ({ title, url, type }) => (
    <div className="group space-y-2">
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{title}</p>
        {type === 'image' ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block relative aspect-video rounded-xl border overflow-hidden">
                <img src={url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ChevronRight className="text-white" size={24} />
                </div>
            </a>
        ) : (
            <audio controls className="w-full h-10 rounded shadow-sm">
                <source src={url} type="audio/mpeg" />
            </audio>
        )}
    </div>
);

export default QueryDetail;
