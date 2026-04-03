import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ChevronLeft,
    MapPin,
    MessageCircle,
    FileText,
    Info,
    Loader2,
    Package,
    User,
    Calendar,
    Hash,
    Link2,
    Image as ImageIcon,
    Mic,
    Edit2,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { getInquiryById, updateInquiryStatus } from '../../api/partners';
import NewUnitDetailModal from './components/NewUnitDetailModal';
import {
    acceptInquiry,
    fetchSiteAssessmentByInquiryId,
    fetchInspectionReportsByInquiryId
} from '../../api/maintenanceApi';
import ChatModal from '../../components/Chat/ChatModal';
import PartnerPostAcceptCard from './components/PartnerPostAcceptCard';
import PartnerInspectionReportModal from './components/PartnerInspectionReportModal';
import { toast } from 'react-hot-toast';

const statusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (s === 'accepted' || s === 'approved') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s === 'rejected') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
};

const formatVal = (v) => {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    return String(v);
};

const formatDateTime = (iso) => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    } catch {
        return formatVal(iso);
    }
};

const shortId = (uuid) => {
    if (!uuid || typeof uuid !== 'string') return '—';
    return `${uuid.slice(0, 8)}…`;
};

const extinguisherLabel = (item) => {
    if (item?.extinguisher_id != null) return `EXT-${item.extinguisher_id}`;
    if (item?.serial_no != null) return `EXT-${item.serial_no}`;
    return `ITEM-${item?.id ?? '—'}`;
};

const DetailField = ({ label, value, className = '' }) => (
    <div className={`p-4 bg-slate-50 rounded-2xl border border-slate-100 ${className}`}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
        <p className="text-slate-900 font-semibold text-sm break-words">{value}</p>
    </div>
);

const MediaLink = ({ href, label, icon: Icon, isAudio = false }) => {
    if (!href) return null;
    if (isAudio) {
        return (
            <div className="flex flex-col gap-2 min-w-[200px]">
                <span className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                    <Icon size={14} className="text-primary-500" />
                    {label}
                </span>
                <audio
                    controls
                    src={href}
                    className="h-8 w-full custom-audio-player"
                >
                    Your browser does not support the audio element.
                </audio>
            </div>
        );
    }
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-sm underline underline-offset-2"
        >
            <Icon size={16} />
            {label}
        </a>
    );
};

const PartnerActionCard = ({ onAccept, onReject, disabled }) => (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft-xl p-8 w-full xl:w-[300px] shrink-0 xl:sticky xl:top-6">
        <h4 className="text-center font-bold text-slate-600 mb-6 uppercase tracking-widest text-xs">
            Awaiting partner action
        </h4>
        <div className="flex flex-col gap-4">
            <button
                type="button"
                onClick={onAccept}
                disabled={disabled}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-emerald-200/80 text-white font-black py-4 rounded-full transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
                <CheckCircle size={22} className="shrink-0" strokeWidth={2.5} />
                Accept inquiry
            </button>
            <button
                type="button"
                onClick={onReject}
                disabled={disabled}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:pointer-events-none font-black py-4 rounded-full transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
                <XCircle size={22} className="shrink-0" strokeWidth={2} />
                Reject
            </button>
        </div>
    </div>
);

const InquiryItemDetailPage = () => {
    const { id: inquiryId, itemId } = useParams();
    const [inquiry, setInquiry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [siteAssessment, setSiteAssessment] = useState(null);
    const [inspectionReports, setInspectionReports] = useState([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [docsError, setDocsError] = useState('');
    const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
    const [isNewUnitModalOpen, setIsNewUnitModalOpen] = useState(false);

    const loadInquiry = async ({ showPageLoader = true } = {}) => {
        if (showPageLoader) setLoading(true);
        try {
            const data = await getInquiryById(inquiryId);
            setInquiry(data);
            setError('');
        } catch (e) {
            console.error(e);
            setError('Failed to load inquiry');
            toast.error('Failed to load inquiry');
        } finally {
            if (showPageLoader) setLoading(false);
        }
    };

    useEffect(() => {
        loadInquiry({ showPageLoader: true });
    }, [inquiryId]);

    useEffect(() => {
        if (!inquiryId || !inquiry) {
            setSiteAssessment(null);
            setInspectionReports([]);
            return;
        }
        const isMaint = (inquiry.type || inquiry.inquiry_type || '').toString().trim().toLowerCase() === 'maintenance';
        const acc = (inquiry.status || '').toLowerCase() === 'accepted';
        if (!isMaint || !acc) {
            setSiteAssessment(null);
            setInspectionReports([]);
            return;
        }
        let cancelled = false;
        (async () => {
            setDocsLoading(true);
            setDocsError('');
            try {
                const [a, r] = await Promise.all([
                    fetchSiteAssessmentByInquiryId(inquiryId),
                    fetchInspectionReportsByInquiryId(inquiryId)
                ]);
                if (cancelled) return;
                setSiteAssessment(a);
                setInspectionReports(Array.isArray(r) ? r : []);
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    setDocsError(
                        'Could not load site assessment or inspection reports. Check that the API is running and you have access to this inquiry.'
                    );
                    setSiteAssessment(null);
                    setInspectionReports([]);
                }
            } finally {
                if (!cancelled) setDocsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [inquiryId, inquiry]);

    const item = inquiry?.inquiry_items?.find((row) => String(row.id) === String(itemId));

    const chatExtinguisherId = item?.extinguisher_id != null ? String(item.extinguisher_id) : null;

    const openChat = () => {
        if (!chatExtinguisherId) {
            toast.error('No extinguisher linked to this line item for chat.');
            return;
        }
        setIsChatOpen(true);
    };

    const handleStatusUpdate = async (newStatus) => {
        setActionLoading(true);
        try {
            if (newStatus === 'accepted') {
                await acceptInquiry(inquiryId);
            } else {
                await updateInquiryStatus(inquiryId, newStatus);
            }
            toast.success(`Inquiry ${newStatus} successfully`);
            await loadInquiry({ showPageLoader: false });
        } catch (err) {
            toast.error(`Failed to ${newStatus} inquiry`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-500" size={40} />
            </div>
        );
    }

    if (error || !inquiry) {
        return (
            <div className="p-12 text-center space-y-4">
                <p className="text-slate-600 font-bold">{error || 'Inquiry not found'}</p>
                <Link to={`/partner/inquiry/${inquiryId}`} className="text-primary-600 font-bold underline">
                    Back to inquiry items
                </Link>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="p-12 text-center space-y-4">
                <p className="text-slate-600 font-bold">Line item not found</p>
                <Link to={`/partner/inquiry/${inquiryId}`} className="text-primary-600 font-bold underline">
                    Back to inquiry items
                </Link>
            </div>
        );
    }

    const customer = inquiry.customers || {};
    const businessName = customer.business_name || 'Client';
    const address = customer.address || '—';
    const inquiryType = (inquiry.inquiry_type || inquiry.type || '—').toString().replace(/_/g, ' ');
    const priorityRaw = inquiry.priority || 'Medium';
    const priority = typeof priorityRaw === 'string' ? priorityRaw : String(priorityRaw);
    const displayStatus = inquiry.status || 'Pending';

    const issueParts = [
        item.maintenance_notes,
        item.system_type && `Component: ${item.system_type}`,
        item.system && `System: ${item.system}`
    ].filter(Boolean);
    const issueText =
        inquiry.description ||
        inquiry.notes ||
        (issueParts.length ? issueParts.join(' · ') : null) ||
        'No issue notes for this line item.';

    const itemServices = Array.isArray(item.inquiry_item_services) ? item.inquiry_item_services : [];
    const isInquiryPending = (inquiry.status || '').toLowerCase() === 'pending';
    const isMaintenanceInquiry =
        (inquiry.type || inquiry.inquiry_type || '').toString().trim().toLowerCase() === 'maintenance';
    const isInquiryAccepted = (inquiry.status || '').toLowerCase() === 'accepted';

    return (
        <div className="min-h-screen pb-20 animate-in fade-in duration-500">
            <Link
                to={`/partner/inquiry/${inquiryId}`}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-8 transition-colors"
            >
                <ChevronLeft size={20} />
                Back to Inquiry Items
            </Link>

            <div className="flex flex-col xl:flex-row gap-8 items-start">
                <div className="flex-1 min-w-0 w-full bg-white rounded-[2rem] border border-slate-100 shadow-soft-xl p-6 md:p-10 space-y-10">
                    {/* Top: badges + extinguisher */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-700 border border-slate-200">
                                    {inquiry.inquiry_no || `INQ-${inquiryId}`}
                                </span>
                                <span
                                    className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${statusBadgeClass(displayStatus)}`}
                                >
                                    {displayStatus}
                                </span>
                                <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-slate-900 text-white border border-slate-800">
                                    Line #{item.id}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                                <Hash size={12} />
                                Inquiry ID {shortId(inquiry.id)} · Visit #{formatVal(inquiry.visit_id)} · Agent #
                                {formatVal(inquiry.agent_id)}
                            </p>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 lg:min-w-[220px]">
                            <div className="p-2.5 rounded-xl bg-primary-100 text-primary-600">
                                <FileText size={22} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Extinguisher ID
                                </p>
                                <p className="text-lg font-black text-slate-900 tracking-tight">{extinguisherLabel(item)}</p>
                                <p className="text-[10px] text-slate-500 mt-1 font-mono">DB id {item.extinguisher_id ?? '—'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer header */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight mb-3">
                                {businessName}
                            </h1>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <p className="text-slate-600 flex items-center gap-2">
                                    <MapPin size={18} className="text-slate-400 shrink-0" />
                                    {address}
                                </p>
                                <button
                                    type="button"
                                    onClick={openChat}
                                    className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!chatExtinguisherId}
                                    title={!chatExtinguisherId ? 'Link an extinguisher to enable chat' : 'Open chat'}
                                >
                                    <MessageCircle size={18} />
                                    Message Customer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Customer contact */}
                    <div>
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <User size={16} />
                            Customer contact
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <DetailField label="Owner" value={formatVal(customer.owner_name)} />
                            <DetailField
                                label="Email"
                                value={
                                    customer.email ? (
                                        <a href={`mailto:${customer.email}`} className="text-primary-600 hover:underline">
                                            {customer.email}
                                        </a>
                                    ) : (
                                        '—'
                                    )
                                }
                            />
                            <DetailField
                                label="Phone"
                                value={
                                    customer.phone ? (
                                        <a href={`tel:${customer.phone}`} className="text-primary-600 hover:underline">
                                            {customer.phone}
                                        </a>
                                    ) : (
                                        '—'
                                    )
                                }
                            />
                            <DetailField label="Customer ID" value={formatVal(customer.id ?? inquiry.customer_id)} />
                        </div>
                    </div>

                    {/* Inquiry metadata */}
                    <div className="border-t border-slate-100 pt-10">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Calendar size={16} />
                            Inquiry metadata
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <DetailField label="Inquiry type" value={inquiryType} />
                            <DetailField
                                label="Priority"
                                value={
                                    <span
                                        className={
                                            priority.toLowerCase() === 'high'
                                                ? 'text-red-500 font-black uppercase'
                                                : 'font-bold capitalize'
                                        }
                                    >
                                        {priority}
                                    </span>
                                }
                            />
                            <DetailField label="Partner ID" value={formatVal(inquiry.partner_id)} />
                            <DetailField label="Created" value={formatDateTime(inquiry.created_at)} />
                            <DetailField label="Last updated" value={formatDateTime(inquiry.updated_at)} />
                        </div>
                    </div>

                    {/* Inquiry information (summary) */}
                    <div className="border-t border-slate-100 pt-10">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                            <Info size={22} className="text-primary-500" />
                            Inquiry information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Service type</p>
                                <p className="text-slate-900 font-bold text-lg capitalize">{inquiryType}</p>
                            </div>
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Priority</p>
                                <p
                                    className={`font-black text-lg uppercase ${priority.toLowerCase() === 'high' ? 'text-red-500' : 'text-slate-900'
                                        }`}
                                >
                                    {priority}
                                </p>
                            </div>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Issue / notes</p>
                            <p className="text-slate-700 italic leading-relaxed">&quot;{issueText}&quot;</p>
                        </div>
                    </div>

                    {/* Line item — product & commercial */}
                    <div className="border-t border-slate-100 pt-10">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Package size={16} />
                            Line item — product &amp; pricing
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <DetailField label="Product type" value={formatVal(item.type)} />
                            <DetailField label="Brand" value={formatVal(item.brand)} />
                            <DetailField label="Capacity" value={formatVal(item.capacity)} />
                            <DetailField label="Unit" value={formatVal(item.unit)} />
                            <DetailField label="Quantity" value={formatVal(item.quantity)} />
                            <DetailField
                                label="Unit price"
                                value={item.price != null ? `$${item.price}` : '—'}
                            />
                            <DetailField label="Condition" value={formatVal(item.condition)} />
                            <DetailField label="Item status" value={formatVal(item.status)} />
                            <DetailField label="Seller" value={formatVal(item.seller)} />
                            <DetailField label="Partner (line)" value={formatVal(item.partner)} />
                        </div>
                    </div>

                    {/* Identification & systems */}
                    <div className="border-t border-slate-100 pt-10">
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Hash size={16} />
                                Identification &amp; systems
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsNewUnitModalOpen(true)}
                                className="p-2 bg-slate-900 hover:bg-primary-500 text-white rounded-xl shadow-lg transition-all active:scale-95 group"
                                title="Edit identification details"
                            >
                                <Edit2 size={14} className="group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <DetailField label="Serial no." value={formatVal(item.serial_no)} />
                            <DetailField label="Catalog no." value={formatVal(item.catalog_no)} />
                            <DetailField label="Sub-unit" value={formatVal(item.is_sub_unit)} />
                            <DetailField label="Query status" value={formatVal(item.query_status)} />
                            <DetailField label="System" value={formatVal(item.system)} />
                            <DetailField label="System type" value={formatVal(item.system_type)} />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="border-t border-slate-100 pt-10">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Calendar size={16} />
                            Dates
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <DetailField label="Install date" value={formatDateTime(item.install_date)} />
                            <DetailField label="Expiry date" value={formatDateTime(item.expiry_date)} />
                            {item.status === "Refilled" && (
                                <DetailField label="Last refill" value={formatDateTime(item.last_refill_date)} />
                            )}
                            <DetailField label="Item created" value={formatDateTime(item.created_at)} />
                            <DetailField label="Item updated" value={formatDateTime(item.updated_at)} />
                        </div>
                    </div>

                    {/* Media */}
                    <div className="border-t border-slate-100 pt-10">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ImageIcon size={16} />
                            Media &amp; attachments
                        </h2>
                        <div className="flex flex-wrap gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <MediaLink href={item.certificate_photo} label="Certificate photo" icon={ImageIcon} />
                            <MediaLink href={item.extinguisher_photo} label="Extinguisher photo" icon={ImageIcon} />
                            <MediaLink href={item.maintenance_unit_photo_url} label="Maintenance unit photo" icon={ImageIcon} />
                            <MediaLink href={item.maintenance_voice_url} label="Voice note" icon={Mic} isAudio={true} />
                            {!item.certificate_photo &&
                                !item.extinguisher_photo &&
                                !item.maintenance_unit_photo_url &&
                                !item.maintenance_voice_url && (
                                    <p className="text-sm text-slate-500 italic">No media uploaded for this line item.</p>
                                )}
                        </div>
                    </div>



                    {isMaintenanceInquiry && isInquiryAccepted && (
                        <div className="border-t border-slate-100 pt-10">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FileText size={16} />
                                Technical documentation
                            </h2>
                            {docsError && <p className="text-sm text-red-600 font-medium mb-4">{docsError}</p>}
                            {docsLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="animate-spin text-primary-500" size={32} />
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                            Site assessment
                                        </h3>
                                        {siteAssessment ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                                        Observations
                                                    </p>
                                                    <p className="text-slate-800 text-sm whitespace-pre-wrap">
                                                        {siteAssessment.observations || '—'}
                                                    </p>
                                                </div>
                                                <div className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                                        Required services
                                                    </p>
                                                    <p className="text-slate-800 text-sm whitespace-pre-wrap">
                                                        {siteAssessment.required_services || '—'}
                                                    </p>
                                                </div>
                                                <DetailField
                                                    label="Estimated cost ($)"
                                                    value={
                                                        siteAssessment.estimated_cost != null &&
                                                            siteAssessment.estimated_cost !== ''
                                                            ? `$${siteAssessment.estimated_cost}`
                                                            : '—'
                                                    }
                                                />
                                                <DetailField
                                                    label="Additional notes"
                                                    value={formatVal(siteAssessment.additional_notes)}
                                                />
                                                <DetailField
                                                    label="Assessment updated"
                                                    value={formatDateTime(siteAssessment.updated_at)}
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                No site assessment on file yet. Use <strong>Start site assessment</strong> in the
                                                panel to add one.
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                            Inspection reports
                                        </h3>
                                        {inspectionReports.length === 0 ? (
                                            <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                No inspection reports submitted yet. Use <strong>Upload inspection report</strong>{' '}
                                                to attach a PDF or Excel file.
                                            </p>
                                        ) : (
                                            <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        <tr>
                                                            <th className="px-4 py-3">Title</th>
                                                            <th className="px-4 py-3">Inspection date</th>
                                                            <th className="px-4 py-3">File</th>
                                                            <th className="px-4 py-3">Submitted</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {inspectionReports.map((rep) => (
                                                            <tr key={rep.id}>
                                                                <td className="px-4 py-3 font-semibold text-slate-900">
                                                                    {rep.report_title}
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600">
                                                                    {rep.inspection_date
                                                                        ? new Date(rep.inspection_date).toLocaleDateString()
                                                                        : '—'}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {rep.file_url ? (
                                                                        <a
                                                                            href={rep.file_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-primary-600 font-bold text-xs uppercase tracking-wide hover:underline"
                                                                        >
                                                                            Open
                                                                        </a>
                                                                    ) : (
                                                                        '—'
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-500 text-xs">
                                                                    {formatDateTime(rep.created_at)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {isInquiryPending && (
                    <PartnerActionCard
                        onAccept={() => handleStatusUpdate('accepted')}
                        onReject={() => handleStatusUpdate('rejected')}
                        disabled={actionLoading}
                    />
                )}
                {isMaintenanceInquiry && isInquiryAccepted && (
                    <PartnerPostAcceptCard
                        inquiryId={inquiryId}
                        itemId={itemId}
                        onUploadReport={() => setInspectionModalOpen(true)}
                    />
                )}
            </div>

            {chatExtinguisherId && (
                <ChatModal
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    queryId={chatExtinguisherId}
                />
            )}

            <PartnerInspectionReportModal
                isOpen={inspectionModalOpen}
                onClose={() => setInspectionModalOpen(false)}
                inquiryId={inquiryId}
                inquiryNo={inquiry.inquiry_no}
                onSuccess={async () => {
                    if (!isMaintenanceInquiry || !isInquiryAccepted) return;
                    try {
                        const r = await fetchInspectionReportsByInquiryId(inquiryId);
                        setInspectionReports(Array.isArray(r) ? r : []);
                    } catch (e) {
                        console.error(e);
                    }
                }}
            />

            <NewUnitDetailModal
                isOpen={isNewUnitModalOpen}
                onClose={() => setIsNewUnitModalOpen(false)}
                inquiry={{ ...inquiry, selectedItem: item }}
                onUpdate={async () => {
                    await loadInquiry({ showPageLoader: false });
                }}
            />
        </div>
    );
};

export default InquiryItemDetailPage;
