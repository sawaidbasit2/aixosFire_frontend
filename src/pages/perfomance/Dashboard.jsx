import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { ClipboardList, DollarSign, RefreshCcw, Layers } from "lucide-react";

/* ---------- Reusable Card ---------- */
const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100">
    <div className={`p-3 rounded-2xl ${color} bg-opacity-10 w-fit mb-4`}>
      <Icon size={22} className={color.replace("bg-", "text-")} />
    </div>
    <p className="text-sm text-slate-500">{title}</p>
    <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
  </div>
);

const AgentPerformance = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("Monthly"); // header tabs
  const [categoryCountRange, setCategoryCountRange] = useState("Monthly"); // Category Wise Inquiries
  const [categoryValueRange, setCategoryValueRange] = useState("Monthly"); // Category Wise Value
  const [allCategoryValue, setAllCategoryValue] = useState([]);
  const [allCategoryCount, setAllCategoryCount] = useState([]);
  const [refillCountByType, setRefillCountByType] = useState({});

  const [summary, setSummary] = useState({
    today: 0,
    total: 0,
    totalValue: 0,
    refill: 0,
  });

  const [categoryCount, setCategoryCount] = useState([]);
  const [categoryValue, setCategoryValue] = useState([]);
  const [refillTypes, setRefillTypes] = useState([]);

  const toNumber = (val, fallback = 0) =>
    isNaN(Number(val)) ? fallback : Number(val);

  /* ---------- Date Filter ---------- */
  const getDateByRange = (r) => {
    const now = new Date();
    if (r === "Daily") return new Date(now.setDate(now.getDate() - 1));
    if (r === "Weekly") return new Date(now.setDate(now.getDate() - 7));
    return new Date(now.setMonth(now.getMonth() - 6));
  };

  useEffect(() => {
    if (!user) return;

    const fetchPerformance = async () => {
      setLoading(true);

      try {
        const fromDate = getDateByRange("Monthly").toISOString(); // Fetch last 6 months data once

        const { data, error } = await supabase
          .from("extinguishers")
          .select(
            `
        status,
        price,
        quantity,
        type,
        visits (
          visit_date,
          agent_id
        )
      `,
          )
          .eq("visits.agent_id", user.id)
          .gte("visits.visit_date", fromDate);

        if (error) throw error;

        /* ---------- SUMMARY ---------- */
        const todayStr = new Date().toISOString().split("T")[0];

        const totalValue = data.reduce((sum, d) => {
          const price = toNumber(d.price);
          const qty = toNumber(d.quantity, 1);
          return sum + price * qty;
        }, 0);

        const todayInquiries = data.filter(
          (d) => d.visits?.visit_date?.split("T")[0] === todayStr,
        ).length;

        setSummary({
          today: todayInquiries,
          total: data.length,
          totalValue,
          refill: data.filter((d) => d.status === "Refilled").length,
        });

        /* ---------- CATEGORY WISE INQUIRIES ---------- */
        const allCountMap = {};
        data.forEach((d) => {
          allCountMap[d.status] = (allCountMap[d.status] || 0) + 1;
        });

        const allCategoryCount = Object.keys(allCountMap).map((k) => ({
          name: k,
          count: allCountMap[k],
          visit_dates: data
            .filter((item) => item.status === k)
            .map((item) => item.visits?.visit_date),
        }));

        setCategoryCount(allCategoryCount); // save all for local filtering

        /* ---------- CATEGORY WISE VALUE ---------- */
        const allValueMap = {};
        data.forEach((d) => {
          const value = toNumber(d.price) * toNumber(d.quantity, 1);
          allValueMap[d.status] = (allValueMap[d.status] || 0) + value;
        });

        const allCategoryValue = Object.keys(allValueMap).map((k) => ({
          name: k,
          value: allValueMap[k],
          visit_dates: data
            .filter((item) => item.status === k)
            .map((item) => item.visits?.visit_date),
        }));

        setCategoryValue(allCategoryValue); // save all for local filtering

        /* ---------- REFILL TYPES ---------- */
        const refillMap = {};
        data
          .filter((d) => d.status === "Refill")
          .forEach((d) => {
            refillMap[d.type] = (refillMap[d.type] || 0) + 1;
          });

        const refillTypesArray = Object.keys(refillMap).map((k) => ({
          type: k,
          count: refillMap[k],
        }));
        setRefillTypes(refillTypesArray);

        // Also save refill counts by type for top card
        setRefillCountByType(refillMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [user, range, categoryCountRange, categoryValueRange]);

  return (
    <div className="space-y-8">
      {loading && <PageLoader />}

      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Performance</h1>
      </div>

      {/* ---------- STATS ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={ClipboardList}
          title="Today Inquiries"
          value={summary.today}
          color="bg-blue-500"
        />
        <StatCard
          icon={Layers}
          title="Total Inquiries"
          value={summary.total}
          color="bg-green-500"
        />
        <StatCard
          icon={DollarSign}
          title="Total Value"
          value={`$${summary.totalValue}`}
          color="bg-orange-500"
        />
        <StatCard
          icon={RefreshCcw}
          title="Refill Requests"
          value={
            Object.keys(refillCountByType).length > 0
              ? Object.entries(refillCountByType).map(([type, count]) => (
                  <span key={type} className="block">
                    {type}: {count}
                  </span>
                ))
              : summary.refill
          }
          color="bg-red-500"
        />
      </div>

      {/* ---------- CATEGORY CHARTS ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Wise Inquiries */}
        <div className="bg-white p-6 rounded-3xl shadow-soft">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Category Wise Inquiries</h3>
            <div className="flex gap-2">
              {["Daily", "Weekly", "Monthly"].map((r) => (
                <button
                  type="button"
                  key={r}
                  className={`px-3 py-1 text-sm rounded-full ${
                    categoryCountRange === r
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-slate-700"
                  }`}
                  onClick={(e) => {
                    e.preventDefault(); // page reload rokne ke liye
                    setCategoryCountRange(r);
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={categoryCount}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={categoryCountRange === "Daily" ? 0 : -45} // Daily straight, Weekly/Monthly angled
                textAnchor={categoryCountRange === "Daily" ? "middle" : "end"}
                height={categoryCountRange === "Daily" ? 40 : 60} // Daily labels ke liye chhota height
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#3b82f6"
                barSize={categoryCountRange === "Daily" ? 20 : 40} // Daily chhota bar
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Wise Value */}
        <div className="bg-white p-6 rounded-3xl shadow-soft">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Category Wise Value</h3>
            <div className="flex gap-2">
              {["Daily", "Weekly", "Monthly"].map((r) => (
                <button
                  type="button"
                  key={r}
                  className={`px-3 py-1 text-sm rounded-full ${
                    categoryValueRange === r
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-slate-700"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCategoryValueRange(r);
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={categoryValue}>
              <XAxis
                dataKey="name"
                angle={categoryValueRange === "Daily" ? 0 : -45}
                textAnchor={categoryValueRange === "Daily" ? "middle" : "end"}
                height={categoryValueRange === "Daily" ? 40 : 60}
              />
              <YAxis />
              <Tooltip />
              <Area
                type={categoryValueRange === "Daily" ? "linear" : "monotone"} // <-- change here
                dataKey="value"
                stroke="#f97316"
                fill="#fed7aa"
                fillOpacity={0.6}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AgentPerformance;

const PageLoader = () => (
  <div className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);
