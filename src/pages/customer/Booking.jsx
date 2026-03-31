import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Wrench, RefreshCcw, Search, PlusCircle, Calendar, CheckCircle, Clock, Hash } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { createInquiry } from '../../api/partners';

const INQUIRY_TYPES = [
    { key: 'Validation', title: 'Validation', desc: 'Sticker validation and compliance verification for installed units.', icon: Search },
    { key: 'Refill', title: 'Refill', desc: 'Cylinder refilling and related logistics.', icon: RefreshCcw },
    { key: 'Maintenance', title: 'Maintenance', desc: 'Scheduled or corrective maintenance of firefighting equipment.', icon: Wrench },
    { key: 'New Unit', title: 'New Unit', desc: 'New equipment survey, supply, and installation.', icon: PlusCircle }
];

const ServiceOption = ({ icon: Icon, title, desc, selected, onClick }) => (
    <div
        onClick={onClick}
        className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col h-full ${
            selected ? 'border-primary-500 bg-primary-50' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg'
        }`}
    >
        {selected && (
            <div className="absolute top-4 right-4 text-primary-500">
                <CheckCircle size={24} className="fill-primary-500 text-white" />
            </div>
        )}
        <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                selected ? 'bg-primary-200 text-primary-700' : 'bg-slate-100 text-slate-600'
            }`}
        >
            <Icon size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-4 flex-1">{desc}</p>
    </div>
);

const Booking = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [inquiryType, setInquiryType] = useState('Validation');
    const [internalReferenceNumber, setInternalReferenceNumber] = useState('');
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');
    const [inventory, setInventory] = useState([]);
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingInventory, setFetchingInventory] = useState(false);

    React.useEffect(() => {
        if (inquiryType === 'Refill' && user) {
            setFetchingInventory(true);
            supabase
                .from('inquiry_items')
                .select('*')
                .order('updated_at', { ascending: false })
                .eq('customer_id', user.id)
                .then(({ data, error }) => {
                    if (error) throw error;
                    setInventory(data || []);
                })
                .catch((err) => console.error(err))
                .finally(() => setFetchingInventory(false));
        }
    }, [inquiryType, user]);

    const toggleAsset = (id) => {
        setSelectedAssets((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
    };

    const buildItemsPayload = () => {
        if (inquiryType === 'Refill' && selectedAssets.length > 0) {
            return selectedAssets.map((assetId, idx) => {
                const item = inventory.find((x) => x.id === assetId);
                return {
                    serial_no: idx + 1,
                    type: item?.type || null,
                    system_type: item?.capacity || null,
                    capacity: item?.capacity || null,
                    quantity: 1,
                    price: item?.price || 0,
                    unit: item?.unit || 'Pieces',
                    firefighting_system: item?.firefighting_system || null,
                    condition: item?.condition || 'Good',
                    status: 'Refilled',
                    is_sub_unit: false
                };
            });
        }
        return [
            {
                serial_no: 1,
                type: 'General',
                quantity: 1,
                unit: 'Pieces',
                price: 0,
                firefighting_system: null,
                condition: 'Good',
                status: 'Pending',
                is_sub_unit: false
            }
        ];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!internalReferenceNumber.trim()) {
            alert('Please enter your internal reference number.');
            return;
        }
        setLoading(true);
        try {
            const inquiryNo = `INQ-${Date.now()}`;
            const inquiryData = {
                inquiry_no: inquiryNo,
                customer_id: user.id,
                type: inquiryType,
                priority: 'Medium',
                status: 'pending',
                internal_reference_number: internalReferenceNumber.trim(),
                notes: notes.trim() || null,
                preferred_date: date || null
            };

            const items = buildItemsPayload();

            if (import.meta.env.DEV) {
                console.debug('[Customer Booking] createInquiry', { inquiryData, items });
            }

            await createInquiry(inquiryData, items);
            navigate('/customer/dashboard');
        } catch (error) {
            console.error(error);
            alert('Could not submit inquiry: ' + (error?.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-[400px] max-w-4xl mx-auto">
            {loading && <PageLoader message="Submitting your inquiry..." />}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">Create inquiry</h1>
                    <p className="text-slate-500">Same inquiry types as field visits — tracked with your internal reference.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 px-1">1. Inquiry type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {INQUIRY_TYPES.map(({ key, title, desc, icon }) => (
                            <ServiceOption
                                key={key}
                                icon={icon}
                                title={title}
                                desc={desc}
                                selected={inquiryType === key}
                                onClick={() => {
                                    setInquiryType(key);
                                    setSelectedAssets([]);
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-soft border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 px-1 flex items-center gap-2">
                        <Hash size={20} className="text-primary-500" /> Internal reference number
                    </h3>
                    <p className="text-sm text-slate-500 mb-4 px-1">
                        Your organization&apos;s approval / PO reference. Stored with the system-generated inquiry ID.
                    </p>
                    <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="e.g. PO-2025-0042"
                        value={internalReferenceNumber}
                        onChange={(e) => setInternalReferenceNumber(e.target.value)}
                    />
                </div>

                {inquiryType === 'Refill' && (
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 px-1">Select equipment to refill</h3>
                        <p className="text-sm text-slate-500 mb-6">Choose cylinders from your inventory (optional if none listed).</p>

                        {fetchingInventory ? (
                            <div className="text-center py-8">Loading your inventory...</div>
                        ) : inventory.length === 0 ? (
                            <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500">No equipment found — inquiry will still be created with a generic line item.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                                {inventory.map((item) => {
                                    const isSelected = selectedAssets.includes(item.id);
                                    const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleAsset(item.id)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                                                isSelected
                                                    ? 'border-primary-500 bg-white shadow-md'
                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                        isSelected ? 'bg-primary-500 border-primary-500' : 'border-slate-300'
                                                    }`}
                                                >
                                                    {isSelected && <CheckCircle size={14} className="text-white" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">
                                                        {item.type} ({item.capacity})
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        ID #{item.extinguisher_id ?? item.id}{' '}
                                                        {isExpired && (
                                                            <span className="text-red-500 font-bold ml-1">• Expired</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <p className="text-right text-xs text-slate-500 mt-4">{selectedAssets.length} items selected</p>
                    </div>
                )}

                <div className="bg-white p-8 rounded-3xl shadow-soft border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 px-1">Schedule & details</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Preferred date (optional)</label>
                            <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                <Clock size={12} /> Agent or partner will confirm the slot.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Additional notes</label>
                            <textarea
                                className="input-field h-32 resize-none"
                                placeholder="Access instructions, site contact, or safety notes."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto text-lg px-12 py-4">
                        {loading ? 'Submitting...' : 'Submit inquiry'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Booking;
