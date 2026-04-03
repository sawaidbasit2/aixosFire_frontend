import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Phone,
  MapPin,
  User,
  Mail,
  Building2,
  Calendar,
  FireExtinguisher,
  Activity,
  Eye
} from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { useNavigate } from 'react-router-dom';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [queries, setQueries] = useState([]);
  const [inquiryItemsByInquiryId, setInquiryItemsByInquiryId] = useState({});
  const [loading, setLoading] = useState(true);

  const formatLatLng = (value, type) => {
    if (value === null || value === undefined) return 'N/A';
    const rounded = Number(value).toFixed(5);
    if (type === 'lat') return `${rounded}° ${value >= 0 ? 'N' : 'S'}`;
    if (type === 'lng') return `${rounded}° ${value >= 0 ? 'E' : 'W'}`;
    return rounded;
  };

  useEffect(() => {
    const fetchCustomer = async () => {
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (customerData) {
        setCustomer(customerData);

        const { data: queriesData } = await supabase
          .from('inquiries')
          .select('*')
          .eq('customer_id', id)
          .order('created_at', { ascending: false });

        const qList = queriesData || [];
        setQueries(qList);

        if (qList.length > 0) {
          const inquiryIds = qList.map(q => q.id);
          const { data: itemsData } = await supabase
            .from('inquiry_items')
            .select('id,inquiry_id,price,quantity,condition,status')
            .in('inquiry_id', inquiryIds);

          const grouped = {};
          (itemsData || []).forEach(it => {
            if (!grouped[it.inquiry_id]) grouped[it.inquiry_id] = [];
            grouped[it.inquiry_id].push(it);
          });
          setInquiryItemsByInquiryId(grouped);
        }
      }
      setLoading(false);
    };

    fetchCustomer();
  }, [id]);

  return (
    <div className="relative min-h-[400px] max-w-5xl mx-auto p-2 md:p-6 space-y-8">
      {loading && <PageLoader message="Fetching customer details..." />}
      {!loading && !customer && <PageMessage text="Customer not found" />}

      {!loading && customer && (
        <>
          {/* Header */}
          <div className="bg-white p-6 rounded-3xl border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {customer.image_url && (
                <img src={customer.image_url} alt="Profile" className="w-20 h-20 rounded-2xl border object-cover" />
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {customer.business_name || 'Business'}
                </h1>
                <p className="text-sm text-slate-500">
                  Sequence No: <span className="font-semibold text-slate-700">{customer.id}</span>
                </p>
              </div>
            </div>
            <StatusBadge status={customer.status} />
          </div>

          {/* Basic Information */}
          <Section title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Info icon={<User />} label="Owner Name" value={customer.owner_name} />
              <Info icon={<Building2 />} label="Business Type" value={customer.business_type} />
              <Info icon={<Phone />} label="Phone" value={customer.phone} />
              <Info icon={<Mail />} label="Email" value={customer.email} />
              <Info icon={<MapPin />} label="Address" value={customer.address} className="md:col-span-2" />
              <Info icon={<Calendar />} label="Created At" value={formatDate(customer.created_at)} />
              <Info icon={<Activity />} label="Last Updated" value={formatDate(customer.last_updated)} />
            </div>
          </Section>

          {/* Location */}
          <Section title="Location">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Info label="Latitude" value={formatLatLng(customer.location_lat, 'lat')} />
              <Info label="Longitude" value={formatLatLng(customer.location_lng, 'lng')} />
            </div>
          </Section>

          {/* Customer Queries */}
          <Section title={`Customer Queries (${queries.length})`}>
            {queries.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                        <th className="px-4 py-4 text-left">S.No</th>
                        <th className="px-4 py-4 text-left">Inquiry No</th>
                        <th className="px-4 py-4 text-left">Type</th>
                        <th className="px-4 py-4 text-left">Status</th>
                        <th className="px-4 py-4 text-left">Items</th>
                        <th className="px-4 py-4 text-left">Estimated Value</th>
                        <th className="px-4 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queries.map((query) => {
                        const items = inquiryItemsByInquiryId[query.id] || [];
                        const totalValue = items.reduce((acc, it) =>
                          acc + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);

                        return (
                          <tr
                            key={query.id}
                            onClick={() => navigate(`/agent/query/${query.id}`)}
                            className="group hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">#{query.id}</td>
                            <td className="px-4 py-3 font-semibold text-slate-700">{query.inquiry_no || '—'}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{query.type || 'Unknown'}</td>
                            <td className="px-4 py-3">
                              <QueryStatusBadge status={query.status} />
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                {items.length}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-green-700">
                              {totalValue > 0 ? `SAR ${totalValue}` : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/agent/query/${query.id}`); }}
                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"
                              >
                                <Eye size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ==================== MOBILE CARDS (All fields included) ==================== */}
                <div className="block md:hidden space-y-4">
                  {queries.map((query) => {
                    const items = inquiryItemsByInquiryId[query.id] || [];
                    const totalValue = items.reduce((acc, it) =>
                      acc + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);

                    return (
                      <div
                        key={query.id}
                        className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-5">
                          <div>
                            <p className="text-xs text-slate-500">Inquiry ID</p>
                            <p className="font-mono font-semibold text-slate-900">#{query.id}</p>
                          </div>
                          <QueryStatusBadge status={query.status} />
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-slate-500">Inquiry No</p>
                            <p className="font-semibold text-lg text-slate-900">
                              {query.inquiry_no || '—'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">Type</p>
                            <p className="font-medium text-slate-900">{query.type || 'Unknown'}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-slate-500">Items Count</p>
                              <p className="font-semibold text-slate-900">{items.length}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Estimated Value</p>
                              <p className="font-bold text-green-700">
                                {totalValue > 0 ? `SAR ${totalValue}` : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/agent/query/${query.id}`);
                          }}
                          className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-all active:scale-[0.98]"
                        >
                          <Eye size={18} />
                          View Full Details
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
                  <FireExtinguisher size={24} />
                </div>
                <p className="text-slate-500 font-medium">No equipment or queries found.</p>
                <p className="text-xs text-slate-400 mt-1">Logged items will appear here.</p>
              </div>
            )}
          </Section>

          {/* QR Code */}
          {customer.qr_code_url && (
            <Section title="QR Code">
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-white p-6 rounded-2xl border">
                <img src={customer.qr_code_url} alt="QR Code" className="w-32 h-32 border rounded-2xl" />
                <p className="text-sm text-slate-500 text-center sm:text-left">
                  Scan this QR code to identify the customer quickly.
                </p>
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
};

/* ---------- Reusable Components ---------- */
const QueryStatusBadge = ({ status }) => {
  const colors = {
    Pending: 'bg-yellow-100 text-yellow-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    Resolved: 'bg-green-100 text-green-700',
    Closed: 'bg-slate-100 text-slate-600',
    Valid: 'bg-green-100 text-green-700',
    Expired: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
      {status || 'Pending'}
    </span>
  );
};

const Section = ({ title, children }) => (
  <div className="bg-white rounded-3xl border shadow-soft p-6 space-y-4">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    {children}
  </div>
);

const Info = ({ label, value, icon, className = '' }) => (
  <div className={`flex gap-3 ${className}`}>
    {icon && <div className="text-slate-400 mt-1 flex-shrink-0">{icon}</div>}
    <div className="min-w-0 flex-1">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900 break-words">{value || 'N/A'}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    Lead: 'bg-blue-100 text-blue-700',
    Active: 'bg-green-100 text-green-700',
    Inactive: 'bg-slate-100 text-slate-600',
  };

  return (
    <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${colors[status] || colors.Lead}`}>
      {status || 'Lead'}
    </span>
  );
};

const PageMessage = ({ text }) => <div className="p-10 text-center text-slate-500">{text}</div>;

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

export default CustomerDetails;