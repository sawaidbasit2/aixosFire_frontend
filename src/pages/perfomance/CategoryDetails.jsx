import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";
import PageLoader from "../../components/PageLoader";
import { Settings, FileDown, Check, ChevronDown, Eye } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ALL_COLUMNS = [
  { id: "seq", label: "S.No" },
  { id: "created_at", label: "Created" },
  { id: "type", label: "Type" },
  { id: "capacity", label: "Capacity" },
  { id: "quantity", label: "Qty" },
  { id: "unit", label: "Unit" },
  { id: "price", label: "Price" },
  { id: "status", label: "Status" },
  { id: "condition", label: "Condition" },
  { id: "brand", label: "Brand" },
  { id: "seller", label: "Seller" },
  { id: "partner", label: "Partner" },
  { id: "system", label: "System" },
  { id: "fire_alarm", label: "Fire Alarm" },
  { id: "pump", label: "Pump" },
  { id: "install_date", label: "Install Date" },
  { id: "last_refill", label: "Last Refill" },
  { id: "expiry_date", label: "Expiry Date" },
  { id: "notes", label: "Notes" },
  { id: "media", label: "Media" },
  { id: "actions", label: "Actions" },
];

const DEFAULT_VISIBLE_COLUMNS = ["seq", "created_at", "type", "capacity", "price", "status", "condition", "actions"];

const CategoryDetails = () => {
  const { category } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  const formattedCategory =
    category.charAt(0).toUpperCase() + category.slice(1);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      const { data: fetchedData, error } = await supabase
        .from("extinguishers")
        .select(`
          id,
          type,
          capacity,
          quantity,
          price,
          install_date,
          last_refill_date,
          expiry_date,
          condition,
          status,
          brand,
          seller,
          partner,
          query_status,
          firefighting_system,
          fire_alarm_system,
          pump_type,
          maintenance_notes,
          maintenance_voice_url,
          maintenance_unit_photo_url,
          is_sub_unit,
          unit,
          created_at,
          certificate_photo,
          extinguisher_photo,
          visits (
            visit_date,
            agent_id
          )
        `)
        .eq("status", formattedCategory)
        .eq("visits.agent_id", user.id);

      if (!error) setData(fetchedData);
      setLoading(false);
    };

    fetchData();
  }, [formattedCategory, user]);

  const handleCloseQuery = async (id) => {
    if (!window.confirm("Are you sure you want to close this query?")) return;

    try {
      const { error } = await supabase
        .from("extinguishers")
        .update({ query_status: "Closed" })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setData(prev => prev.map(item =>
        item.id === id ? { ...item, query_status: "Closed" } : item
      ));

      alert("Query closed successfully!");
    } catch (err) {
      console.error("Error closing query:", err);
      alert("Failed to close query");
    }
  };

  const formatDate = (dateStr) => (dateStr ? dateStr.split("T")[0] : "NA");

  const toggleColumn = (columnId) => {
    setVisibleColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleExportPDF = () => {
    const doc = new jsPDF("landscape");

    // Filter out columns that don't make sense in a PDF or are hidden
    const columnsToExport = ALL_COLUMNS.filter(col =>
      visibleColumns.includes(col.id) &&
      col.id !== 'media' &&
      col.id !== 'actions'
    );

    const headers = columnsToExport.map(col => col.label);
    const body = data.map((item, index) => columnsToExport.map(col => {
      switch (col.id) {
        case 'seq': return index + 1;
        case 'created_at': return formatDate(item.created_at);
        case 'type': return item.type || item.firefighting_system || item.fire_alarm_system || item.pump_type || "NA";
        case 'install_date': return formatDate(item.install_date);
        case 'last_refill': return formatDate(item.last_refill_date);
        case 'expiry_date': return formatDate(item.expiry_date);
        case 'price': return item.price !== null ? `SAR ${item.price}` : "NA";
        case 'system': return item.firefighting_system || "NA";
        case 'fire_alarm': return item.fire_alarm_system || "NA";
        case 'pump': return item.pump_type || "NA";
        case 'notes': return item.maintenance_notes || "--";
        default: return item[col.id] || "NA";
      }
    }));

    doc.text(`${formattedCategory} Requests Report`, 14, 15);
    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`${category}_requests_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="relative min-h-[400px] space-y-6">
      {/* Back Link + Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/agent/performance"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{formattedCategory} Requests</h1>
            <p className="text-sm text-slate-500">View and manage detailed performance data</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Column Visibility Filter */}
          <div className="relative">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Settings size={18} className="text-slate-400" />
              <span>Columns</span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${showColumnDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 w-56 max-h-[400px] overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in duration-200">
                <div className="px-3 py-2 border-b border-slate-50 mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Show/Hide Columns</p>
                </div>
                {ALL_COLUMNS.map(col => (
                  <button
                    key={col.id}
                    onClick={() => toggleColumn(col.id)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors group"
                  >
                    <span>{col.label}</span>
                    {visibleColumns.includes(col.id) ? (
                      <Check size={16} className="text-blue-600" />
                    ) : (
                      <div className="w-4 h-4 rounded border border-slate-200" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            <FileDown size={18} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Loading / Empty State */}
      {loading && <PageLoader />}
      {!loading && data.length === 0 ? (
        <p className="text-center py-10">No records found</p>
      ) : !loading && (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-soft border">
          <table className="min-w-full text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                {visibleColumns.includes('seq') && <th className="px-4 py-4 text-left">S.No</th>}
                {visibleColumns.includes('created_at') && <th className="px-4 py-4 text-left">Created</th>}
                {visibleColumns.includes('type') && <th className="px-4 py-4 text-left">Type</th>}
                {visibleColumns.includes('capacity') && <th className="px-4 py-4 text-left">Capacity</th>}
                {visibleColumns.includes('quantity') && <th className="px-4 py-4 text-left">Qty</th>}
                {visibleColumns.includes('unit') && <th className="px-4 py-4 text-left">Unit</th>}
                {visibleColumns.includes('price') && <th className="px-4 py-4 text-left">Price</th>}
                {visibleColumns.includes('status') && <th className="px-4 py-4 text-left">Status</th>}
                {visibleColumns.includes('condition') && <th className="px-4 py-4 text-left">Condition</th>}
                {visibleColumns.includes('brand') && <th className="px-4 py-4 text-left">Brand</th>}
                {visibleColumns.includes('seller') && <th className="px-4 py-4 text-left">Seller</th>}
                {visibleColumns.includes('partner') && <th className="px-4 py-4 text-left">Partner</th>}
                {visibleColumns.includes('system') && <th className="px-4 py-4 text-left">System</th>}
                {visibleColumns.includes('fire_alarm') && <th className="px-4 py-4 text-left">Fire Alarm</th>}
                {visibleColumns.includes('pump') && <th className="px-4 py-4 text-left">Pump</th>}
                {visibleColumns.includes('install_date') && <th className="px-4 py-3 text-left">Install Date</th>}
                {visibleColumns.includes('last_refill') && <th className="px-4 py-3 text-left">Last Refill</th>}
                {visibleColumns.includes('expiry_date') && <th className="px-4 py-3 text-left">Expiry Date</th>}
                {visibleColumns.includes('notes') && <th className="px-4 py-3 text-left">Notes</th>}
                {visibleColumns.includes('media') && <th className="px-4 py-3 text-center">Media</th>}
                {visibleColumns.includes('actions') && <th className="px-4 py-3 text-center text-slate-300">#</th>}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-slate-100">
              {data.map((item, i) => (
                <tr
                  key={item.id}
                  className={`transition hover:bg-blue-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                >
                  {visibleColumns.includes('seq') && (
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">#{item.id}</td>
                  )}
                  {visibleColumns.includes('created_at') && (
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(item.created_at)}</td>
                  )}
                  {visibleColumns.includes('type') && (
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                      {item.type || item.firefighting_system || item.fire_alarm_system || item.pump_type || "NA"}
                    </td>
                  )}
                  {visibleColumns.includes('capacity') && (
                    <td className="px-4 py-3 text-slate-600">{item.capacity || (item.firefighting_system ? "System" : "NA")}</td>
                  )}
                  {visibleColumns.includes('quantity') && (
                    <td className="px-4 py-3 text-slate-600">{item.quantity ?? "NA"}</td>
                  )}
                  {visibleColumns.includes('unit') && (
                    <td className="px-4 py-3 text-slate-500">{item.unit || "Pieces"}</td>
                  )}
                  {visibleColumns.includes('price') && (
                    <td className="px-4 py-3 font-bold text-green-700">
                      {item.price !== null ? `SAR ${item.price}` : "NA"}
                    </td>
                  )}
                  {visibleColumns.includes('status') && (
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Valid' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'}`}>
                        {item.status || "NA"}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes('condition') && (
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.condition === 'Good' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                        {item.condition || "NA"}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes('brand') && (
                    <td className="px-4 py-3 text-slate-600">{item.brand || "NA"}</td>
                  )}
                  {visibleColumns.includes('seller') && (
                    <td className="px-4 py-3 text-slate-600">{item.seller || "NA"}</td>
                  )}
                  {visibleColumns.includes('partner') && (
                    <td className="px-4 py-3 text-slate-600">{item.partner || "NA"}</td>
                  )}
                  {visibleColumns.includes('system') && (
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{item.firefighting_system || "NA"}</td>
                  )}
                  {visibleColumns.includes('fire_alarm') && (
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{item.fire_alarm_system || "NA"}</td>
                  )}
                  {visibleColumns.includes('pump') && (
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{item.pump_type || "NA"}</td>
                  )}
                  {visibleColumns.includes('install_date') && (
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">{formatDate(item.install_date)}</td>
                  )}
                  {visibleColumns.includes('last_refill') && (
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">{formatDate(item.last_refill_date)}</td>
                  )}
                  {visibleColumns.includes('expiry_date') && (
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">{formatDate(item.expiry_date)}</td>
                  )}
                  {visibleColumns.includes('notes') && (
                    <td className="px-4 py-3 max-w-[150px] truncate text-slate-400 italic text-xs" title={item.maintenance_notes}>
                      {item.maintenance_notes || "--"}
                    </td>
                  )}
                  {visibleColumns.includes('media') && (
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {item.extinguisher_photo && (
                          <a href={item.extinguisher_photo} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Extinguisher Photo">🖼️</a>
                        )}
                        {item.maintenance_unit_photo_url && (
                          <a href={item.maintenance_unit_photo_url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors" title="Maintenance Photo">🛠️</a>
                        )}
                        {item.maintenance_voice_url && (
                          <a href={item.maintenance_voice_url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors" title="Voice Note">🎤</a>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes('actions') && (
                    <td className="px-4 py-3 text-center">
                      {item.query_status === 'Active' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/agent/query/${item.id}`);
                            }}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseQuery(item.id);
                            }}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-bold text-[10px] uppercase tracking-wider whitespace-nowrap"
                          >
                            Close Query
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-bold text-[10px] uppercase tracking-widest italic">Closed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CategoryDetails;
