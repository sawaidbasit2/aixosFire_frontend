import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Split, Truck, Info, XCircle, MessageCircle, ChevronLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Process Refill Request — Partner inquiry detail (Refill type). Data from buildRefillInquiryViewModel.
 */
const RefillInquiryDetail = ({ viewModel }) => {
    const {
        inquiryNo,
        customerName,
        totalCylinders,
        fillingChargePerUnit,
        transportChargePerUnit,
        pickupTypeLabel,
        pickupStrategyDescription,
        isTransportChargeable,
        requirementNote,
        customerEmail
    } = viewModel;

    const maxCylinders = Math.max(0, totalCylinders);
    const [acceptedCount, setAcceptedCount] = useState(maxCylinders);

    useEffect(() => {
        setAcceptedCount(maxCylinders);
    }, [maxCylinders]);

    const rejectedCount = Math.max(0, maxCylinders - acceptedCount);
    const estimatedTotalPerUnit = fillingChargePerUnit + (isTransportChargeable ? transportChargePerUnit : 0);

    const mailHref = customerEmail ? `mailto:${customerEmail}` : null;

    const defaultPickupDescription =
        isTransportChargeable && transportChargePerUnit > 0
            ? `Partner is responsible for pickup. Transportation charges of $${transportChargePerUnit}/unit are added.`
            : 'Agent or customer will drop the units. No transport charge per unit applies.';

    const pickupBody = pickupStrategyDescription?.trim() ? pickupStrategyDescription : defaultPickupDescription;

    const handleFinalize = () => {
        toast.success(
            rejectedCount > 0
                ? `Recorded: ${acceptedCount} accepted, ${rejectedCount} rejected (re-allocation may apply).`
                : `All ${acceptedCount} cylinders accepted.`
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link
                to="/partner/dashboard"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-500 transition-colors mb-6 font-bold text-sm"
            >
                <ChevronLeft size={18} /> Back to Global List
            </Link>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft-xl overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Process Refill Request</h2>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                            <p className="text-slate-500 font-medium">
                                Inquiry: {inquiryNo} | {customerName}
                            </p>
                            {mailHref ? (
                                <a
                                    href={mailHref}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-slate-200"
                                >
                                    <MessageCircle size={14} /> Message Customer
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    disabled
                                    title="No customer email on file"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                                >
                                    <MessageCircle size={14} /> Message Customer
                                </button>
                            )}
                        </div>
                    </div>
                    <Link
                        to="/partner/dashboard"
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 self-start shrink-0"
                        aria-label="Close"
                    >
                        <XCircle size={24} />
                    </Link>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Split size={20} className="text-primary-500" /> Partial Accept/Reject Logic
                            </h3>
                            {requirementNote ? (
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 italic text-sm text-slate-600 mb-6 leading-relaxed">
                                    {requirementNote}
                                </div>
                            ) : null}

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Accept Cylinders</p>
                                        <p className="text-2xl font-black text-primary-600">
                                            {acceptedCount} / {maxCylinders || 0}
                                        </p>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={Math.max(0, maxCylinders)}
                                        value={Math.min(acceptedCount, Math.max(0, maxCylinders))}
                                        onChange={(e) => setAcceptedCount(parseInt(e.target.value, 10) || 0)}
                                        disabled={maxCylinders <= 0}
                                        className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-500 disabled:opacity-50"
                                    />
                                    <div className="flex justify-between mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>0</span>
                                        <span>{maxCylinders} Max</span>
                                    </div>
                                </div>
                                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3 text-red-700">
                                    <XCircle size={20} className="flex-shrink-0 mt-0.5" />
                                    <p className="text-xs font-medium">
                                        <strong>{rejectedCount}</strong> cylinders will be rejected and re-allocated back to the system.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Truck size={20} className="text-primary-500" /> Pricing Breakdown
                            </h3>
                            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                    <p className="text-slate-500 font-medium">Refilling Charges</p>
                                    <p className="font-display font-black text-slate-900 text-lg">
                                        ${fillingChargePerUnit.toFixed(2)}{' '}
                                        <span className="text-xs text-slate-400 font-bold">/ unit</span>
                                    </p>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-slate-500 font-medium">Transport Charges</p>
                                        {isTransportChargeable && (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black uppercase">
                                                Chargeable
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-display font-black text-emerald-600 text-lg">
                                        ${transportChargePerUnit.toFixed(2)}{' '}
                                        <span className="text-xs text-slate-400 font-bold">/ unit</span>
                                    </p>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <p className="text-slate-900 font-black uppercase text-sm">Estimated Total Per Unit</p>
                                    <p className="font-display font-black text-primary-600 text-2xl">${estimatedTotalPerUnit.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-end space-y-4 lg:min-h-[320px]">
                        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                            <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2 uppercase tracking-widest text-xs">
                                <Info size={16} /> Pickup Strategy: {pickupTypeLabel}
                            </h4>
                            <p className="text-xs text-amber-700 leading-relaxed font-medium">{pickupBody}</p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                type="button"
                                onClick={handleFinalize}
                                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl transform active:scale-95 transition-all text-lg shadow-xl shadow-slate-200 hover:bg-slate-800"
                            >
                                FINALIZE SELECTION
                            </button>
                            <Link
                                to="/partner/dashboard"
                                className="block w-full text-center bg-white text-slate-400 font-bold py-4 rounded-2xl hover:text-slate-600 transition-all text-sm"
                            >
                                CANCEL PROCESS
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefillInquiryDetail;
