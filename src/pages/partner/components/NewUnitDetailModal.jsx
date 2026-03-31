import React, { useState, useEffect } from 'react';
import { X, Package, ChevronDown, CheckCircle, AlertCircle, Search, Maximize2, Tag, Loader2 } from 'lucide-react';
import ProductSpecsModal from './ProductSpecsModal';
import { updateInquiryItem } from '../../../api/partners';
import { toast } from 'react-hot-toast';

const NewUnitDetailModal = ({ isOpen, onClose, inquiry, onUpdate }) => {
    const [selectedProductName, setSelectedProductName] = useState('');
    const [selectedCatalogNo, setSelectedCatalogNo] = useState('');
    const [productInfo, setProductInfo] = useState(null);
    const [confirmedQuantity, setConfirmedQuantity] = useState(0);
    const [pricePerUnit, setPricePerUnit] = useState(0);
    const [remarks, setRemarks] = useState('');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [allCatalogs, setAllCatalogs] = useState([]);
    const [availableCatalogs, setAvailableCatalogs] = useState([]);

    const estimatedPrice = pricePerUnit * confirmedQuantity;

    useEffect(() => {
        if (inquiry && isOpen) {
            const preselected = inquiry.selectedItem || {};
            const baseProductName = preselected.type || preselected.firefighting_system || '';
            const options = Array.isArray(preselected.catalog_options) ? preselected.catalog_options : [];
            const normalizedCatalogs = options
                .filter((option) => option?.catalog_no)
                .map((option) => ({ ...option, productName: option.productName || baseProductName }));
            const fallbackCatalogNo =
                preselected.catalog_no ||
                preselected.catalog_number ||
                preselected.catalogNo ||
                (preselected.id ? `ITEM-${preselected.id}` : '');
            const fallbackCatalogs = fallbackCatalogNo
                ? [{ catalog_no: fallbackCatalogNo, productName: baseProductName }]
                : [];
            const products = [baseProductName, ...normalizedCatalogs.map((item) => item.productName)]
                .filter(Boolean)
                .filter((item, idx, arr) => arr.indexOf(item) === idx);

            const catalogsToUse = normalizedCatalogs.length > 0 ? normalizedCatalogs : fallbackCatalogs;
            setAvailableProducts(products);
            setAllCatalogs(catalogsToUse);
            setAvailableCatalogs(catalogsToUse);
            setSelectedProductName(baseProductName);
            setSelectedCatalogNo(fallbackCatalogNo);
            setPricePerUnit(preselected.price || 0);
            setConfirmedQuantity(preselected.quantity || inquiry.quantity || 0);
            setRemarks(preselected.maintenance_notes || '');
        }
    }, [inquiry, isOpen]);

    useEffect(() => {
        if (!selectedCatalogNo) {
            setProductInfo(null);
            return;
        }

        const currentItem = inquiry?.selectedItem || {};
        const selectedCatalog = availableCatalogs.find((item) => item.catalog_no === selectedCatalogNo);
        setProductInfo({
            productName: selectedProductName || currentItem.type || currentItem.firefighting_system || 'Fire Equipment',
            catalog_no: selectedCatalogNo,
            capacity: selectedCatalog?.capacity || currentItem.capacity || '--',
            type: selectedCatalog?.type || currentItem.type || '--',
            manufacturer: selectedCatalog?.manufacturer || currentItem.manufacturer || '--',
            specs: {
                safetyCertification: selectedCatalog?.safetyCertification || currentItem.safetyCertification || '--',
                cylinderMaterial: selectedCatalog?.cylinderMaterial || currentItem.cylinderMaterial || '--',
                description: selectedCatalog?.description || currentItem.system_type || currentItem.maintenance_notes || 'No additional product description provided.'
            }
        });
    }, [selectedCatalogNo, selectedProductName, availableCatalogs, inquiry]);

    if (!isOpen) return null;

    const requestedQuantity = inquiry?.quantity || 0;
    const isRemarksRequired = confirmedQuantity < requestedQuantity;

    const handleConfirm = async () => {
        if (!selectedCatalogNo) {
            toast.error('Please select a catalog number');
            return;
        }
        if (isRemarksRequired && !remarks.trim()) {
            toast.error('Please add remarks since confirmed quantity is less than requested.');
            return;
        }

        setIsLoading(true);
        try {
            await updateInquiryItem(inquiry.selectedItem.id, {
                catalog_no: selectedCatalogNo,
                quantity: confirmedQuantity,
                price: pricePerUnit,
                maintenance_notes: remarks
            });
            setIsSuccess(true);
            toast.success('Item updated successfully');
            setTimeout(() => {
                setIsSuccess(false);
                onClose();
                onUpdate && onUpdate(); // Signal parent to refresh
            }, 1000);
        } catch (err) {
            console.error('Update confirm error:', err);
            toast.error('Failed to update item details');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-50">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                Unit <span className="text-primary-500">Details.</span>
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                                <p className="text-slate-500 text-sm font-medium">
                                    {inquiry?.customers?.business_name || inquiry?.business_name || 'Generic Client'} — {inquiry?.inquiry_no}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-2xl transition-all">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-8 max-h-[80vh] overflow-y-auto">
                        {!isSuccess ? (
                            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                                {/* Selection Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                            Select Product
                                        </label>
                                        <div className="relative group">
                                            <select
                                                value={selectedProductName}
                                                onChange={(e) => {
                                                    setSelectedProductName(e.target.value);
                                                    setSelectedCatalogNo('');
                                                    const filtered = allCatalogs.filter((item) => (item.productName || e.target.value) === e.target.value);
                                                    if (filtered.length > 0) {
                                                        setAvailableCatalogs(filtered);
                                                    }
                                                }}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-6 pr-12 appearance-none outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-bold text-slate-900 transition-all cursor-pointer"
                                            >
                                                <option value="">Choose Product</option>
                                                {availableProducts.map((name) => (
                                                    <option key={name} value={name}>{name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-primary-500 transition-colors" size={20} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                            Select Catalog Number
                                        </label>
                                        <div className="relative group">
                                            <select
                                                value={selectedCatalogNo}
                                                onChange={(e) => setSelectedCatalogNo(e.target.value)}
                                                disabled={!selectedProductName}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-6 pr-12 appearance-none outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-bold text-slate-900 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="">{selectedProductName ? 'Choose Catalog No' : 'Select Product First'}</option>
                                                {availableCatalogs.map((item) => (
                                                    <option key={item.catalog_no} value={item.catalog_no}>
                                                        {item.catalog_no}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-primary-500 transition-colors" size={20} />
                                        </div>
                                    </div>
                                </div>

                                {productInfo ? (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {/* Product Overview Card */}
                                        <div className="flex items-center gap-4 bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl">
                                            <div className="p-3 bg-white/10 rounded-2xl">
                                                <Package size={24} className="text-primary-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest mb-0.5">Specifications Summary</p>
                                                <h4 className="text-xl font-black text-white uppercase tracking-tight">{productInfo.productName}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400">
                                                    <span className="flex items-center gap-1"><Tag size={10} /> {productInfo.catalog_no}</span>
                                                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                                    <span>{productInfo.capacity}</span>
                                                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                                    <span>{productInfo.type}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setIsProductModalOpen(true)}
                                                className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white"
                                                title="View Full Specifications"
                                            >
                                                <Maximize2 size={20} />
                                            </button>
                                        </div>

                                        {/* Pricing & Quantity Section */}
                                        <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Partner Response</h5>
                                                <span className="px-3 py-1 bg-primary-50 text-primary-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                                                    Requested: {requestedQuantity}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                <div className="space-y-3">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                                        Price per Unit ($)
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-primary-500 transition-colors">$</div>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={pricePerUnit}
                                                            onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 pl-10 pr-6 outline-none focus:bg-white focus:border-primary-500 font-black text-2xl text-slate-900 transition-all"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                                        Quantity
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={confirmedQuantity}
                                                        onChange={(e) => setConfirmedQuantity(parseInt(e.target.value) || 0)}
                                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 outline-none focus:bg-white focus:border-primary-500 font-black text-2xl text-slate-900 transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-xs font-black text-primary-500 uppercase tracking-widest">
                                                        Estimated Total
                                                    </label>
                                                    <div className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 font-black text-2xl text-slate-400 cursor-not-allowed flex items-center shadow-inner">
                                                        <span className="mr-2">$</span>
                                                        {estimatedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </div>

                                            {isRemarksRequired && (
                                                <div className="space-y-3 pt-4 border-t border-slate-50 animate-in slide-in-from-top-4">
                                                    <label className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                                        <AlertCircle size={14} /> Remarks for lower quantity
                                                    </label>
                                                    <textarea
                                                        value={remarks}
                                                        onChange={(e) => setRemarks(e.target.value)}
                                                        placeholder="Provide a reason..."
                                                        className="w-full bg-rose-50/30 border border-rose-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium text-slate-900 transition-all min-h-[100px]"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleConfirm}
                                            disabled={isLoading}
                                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-[1.5rem] shadow-xl transition-all active:scale-[0.98] text-sm uppercase tracking-[0.2em] mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Availability & Update'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft">
                                            <Search size={32} className="text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Awaiting product & catalog selection...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-20 text-center animate-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <CheckCircle size={48} />
                                </div>
                                <h4 className="text-3xl font-black text-slate-900 tracking-tight">Update Successful!</h4>
                                <p className="text-slate-500 font-medium max-w-xs mx-auto mt-4">
                                    Availability confirmed. The inquiry status has been updated across the system.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ProductSpecsModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                product={productInfo}
            />
        </>
    );
};

export default NewUnitDetailModal;
