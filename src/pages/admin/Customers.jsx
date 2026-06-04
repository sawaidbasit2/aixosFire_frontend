import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Link } from 'react-router-dom';
import { Search, Mail, Phone, MapPin, Building, ChevronRight, Users } from 'lucide-react';
import PageLoader from '../../components/PageLoader';

const AdminCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setCustomers(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="relative min-h-[400px] space-y-6">
            {loading && <PageLoader message="Loading customer base..." />}
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Admin · Management</p>
                    <h1 className="text-2xl font-display font-bold text-slate-900">Customer Management</h1>
                    <p className="text-slate-500 text-sm mt-0.5">View, search and manage all registered businesses.</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl flex items-center gap-2">
                    <Users size={16}/>
                    <span className="text-sm font-bold">{customers.length} total</span>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <Search className="text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by business name or email..."
                    className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                            <th className="px-6 py-4">Business Details</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Join Date</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {!loading && filteredCustomers.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">No customers found.</td></tr>
                        ) : (
                            filteredCustomers.map(customer => (
                                <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{customer.business_name}</div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                            <MapPin size={10} /> {customer.address || 'No Address'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-700 flex items-center gap-2">
                                            <Mail size={12} className="text-slate-400" /> {customer.email || 'No Email'}
                                        </div>
                                        {customer.phone && (
                                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                <Phone size={12} className="text-slate-400" /> {customer.phone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Building size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700 capitalize">{customer.business_type || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(customer.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link to={`/admin/customers/${customer.id}`}
                                            className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                            View <ChevronRight size={13}/>
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminCustomers;
