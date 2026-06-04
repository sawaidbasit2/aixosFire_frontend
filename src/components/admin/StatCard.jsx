import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, subtext, trend, color = 'bg-primary-500', className = '' }) => (
    <div className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ${className}`}>
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-2xl ${color}`}>
                <Icon size={20} className="text-white" />
            </div>
            {trend !== undefined && (
                <span className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1.5">{subtext}</p>}
    </div>
);

export default StatCard;
