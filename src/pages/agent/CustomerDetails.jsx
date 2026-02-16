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
  Scale,
  Box,
  Activity,
  DollarSign,
  ArrowRight,
  Eye
} from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { useNavigate } from 'react-router-dom';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [queries, setQueries] = useState([]);
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
      // Fetch Customer Details
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (customerError) {
        console.error('Error fetching customer:', customerError);
      } else {
        setCustomer(customerData);

        // Fetch Customer Queries (from extinguishers table)
        const { data: queriesData, error: queriesError } = await supabase
          .from('extinguishers')
          .select('*')
          .eq('customer_id', id)
          .order('id', { ascending: false });

        if (queriesError) {
          console.error('Error fetching customer queries:', queriesError);
        } else {
          setQueries(queriesData || []);
        }
      }
      setLoading(false);
    };

    fetchCustomer();
  }, [id]);

  return (
    <div className="relative min-h-[400px] max-w-5xl mx-auto p-6 space-y-8">
      {loading && <PageLoader message="Fetching customer details..." />}
      {!loading && !customer && <PageMessage text="Customer not found" />}
      {!loading && customer && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border">
            <div className="flex items-center gap-5">
              {customer.image_url && (
                <img
                  src={customer.image_url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full border object-cover"
                />
              )}

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {customer.business_name || 'Business'}
                </h1>

                <p className="text-sm text-slate-500">
                  Sequence No: <span className="font-semibold text-slate-700">{customer.id}</span>
                </p>

                <p className="text-xs text-slate-400 mt-1">Customer Profile</p>
              </div>
            </div>

            <StatusBadge status={customer.status} />
          </div>

          {/* Basic Info */}
          <Section title="Basic Information">
            <Grid>
              <Info icon={<User />} label="Owner Name" value={customer.owner_name} />
              <Info icon={<Building2 />} label="Business Type" value={customer.business_type} />
              <Info icon={<Phone />} label="Phone" value={customer.phone} />
              <Info icon={<Mail />} label="Email" value={customer.email} />
              <Info icon={<MapPin />} label="Address" value={customer.address} />
              <Info
                icon={<Calendar />}
                label="Created At"
                value={formatDate(customer.created_at)}
              />
              <Info
                icon={<Activity />}
                label="Last Updated"
                value={formatDate(customer.last_updated)}
              />
            </Grid>
          </Section>

          {/* Location */}
          <Section title="Location">
            <Grid>
              <Info label="Latitude" value={formatLatLng(customer.location_lat, 'lat')} />
              <Info label="Longitude" value={formatLatLng(customer.location_lng, 'lng')} />
            </Grid>
          </Section>

          {/* Customer Queries / Extinguishers */}
          <Section title={`Customer Equipment & Queries (${queries.length})`}>
            {queries.length > 0 ? (
              <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                <table className="min-w-full text-sm divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                      <th className="px-4 py-4 text-left">S.No</th>
                      <th className="px-4 py-4 text-left">Type</th>
                      <th className="px-4 py-4 text-left">Status</th>
                      <th className="px-4 py-4 text-left">Condition</th>
                      <th className="px-4 py-4 text-left">Price</th>
                      <th className="px-4 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queries.map((query, index) => (
                      <tr
                        key={query.id}
                        onClick={() => navigate(`/agent/query/${query.id}`)}
                        className="group hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">#{query.id}</td>
                        {/* <td className="px-4 py-3 font-mono text-xs text-slate-500">{index + 1}</td> */}
                        <td className="px-4 py-3 font-medium text-slate-900">{query.type || 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <QueryStatusBadge status={query.status} />
                        </td>
                        <td className="px-4 py-3">
                          <ActiveStatusBadge status={query.query_status} />
                        </td>
                        <td className="px-4 py-3 font-bold text-green-700">
                          {query.price ? `SAR ${query.price}` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/agent/query/${query.id}`);
                            }}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
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
              <div className="flex items-center gap-6">
                <img
                  src={customer.qr_code_url}
                  alt="QR Code"
                  className="w-32 h-32 border rounded-xl"
                />
                <p className="text-sm text-slate-500">
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
    <span
      className={`px-3 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-600'
        }`}
    >
      {status || 'Pending'}
    </span>
  );
};

const ActiveStatusBadge = ({ status }) => {
  const isActive = status === 'Active';
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}
    >
      {status || 'Active'}
    </span>
  );
};

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border p-6 space-y-4">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    {children}
  </div>
);

const Grid = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
);

const Info = ({ label, value, icon }) => (
  <div className="flex gap-3">
    {icon && <div className="text-slate-400 mt-1">{icon}</div>}
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900">{value || 'N/A'}</p>
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
    <span className={`px-4 py-1 rounded-full text-sm font-bold ${colors[status] || colors.Lead}`}>
      {status || 'Lead'}
    </span>
  );
};

const PageMessage = ({ text }) => (
  <div className="p-10 text-center text-slate-500">{text}</div>
);

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : 'N/A';

export default CustomerDetails;
