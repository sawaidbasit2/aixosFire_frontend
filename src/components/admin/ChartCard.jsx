import React from 'react';

const ChartCard = ({ title, subtitle, children, action, className = '' }) => (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-soft p-6 ${className}`}>
        <div className="flex items-start justify-between mb-6">
            <div>
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
        {children}
    </div>
);

export default ChartCard;
