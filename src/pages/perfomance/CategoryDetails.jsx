import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";

const CategoryDetails = () => {
  const { category } = useParams();
  const { user } = useAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
          brand,
          seller,
          partner,
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

  const formatDate = (dateStr) => (dateStr ? dateStr.split("T")[0] : "NA");

  return (
    <div className="space-y-6">
      {/* Back Link + Title */}
      <div className="flex items-center gap-3">
        <Link
          to="/agent/performance"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back
        </Link>

        <h1 className="text-2xl font-bold">{formattedCategory} Requests</h1>
      </div>

      {/* Loading / Empty State */}
      {loading ? (
        <p className="text-center py-10">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-center py-10">No records found</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-soft border">
          <table className="min-w-full text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-slate-600 uppercase text-xs tracking-wide">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Capacity</th>
                <th className="px-4 py-3 text-left">Quantity</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Brand</th>
                <th className="px-4 py-3 text-left">Seller</th>
                <th className="px-4 py-3 text-left">Partner</th>
                <th className="px-4 py-3 text-left">Condition</th>
                <th className="px-4 py-3 text-left">Install Date</th>
                <th className="px-4 py-3 text-left">Last Refill</th>
                <th className="px-4 py-3 text-left">Expiry Date</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-slate-100">
              {data.map((item, i) => (
                <tr
                  key={item.id}
                  className={`transition hover:bg-blue-50 ${
                    i % 2 === 0 ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-3">{formatDate(item.visits?.visit_date)}</td>
                  <td className="px-4 py-3">{item.type || "NA"}</td>
                  <td className="px-4 py-3">{item.capacity || "NA"}</td>
                  <td className="px-4 py-3">{item.quantity ?? "NA"}</td>
                  <td className="px-4 py-3">
                    {item.price !== null ? `$${item.price}` : "NA"}
                  </td>
                  <td className="px-4 py-3">{item.brand || "NA"}</td>
                  <td className="px-4 py-3">{item.seller || "NA"}</td>
                  <td className="px-4 py-3">{item.partner || "NA"}</td>
                  <td className="px-4 py-3">{item.condition || "NA"}</td>
                  <td className="px-4 py-3">{formatDate(item.install_date)}</td>
                  <td className="px-4 py-3">{formatDate(item.last_refill_date)}</td>
                  <td className="px-4 py-3">{formatDate(item.expiry_date)}</td>
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
