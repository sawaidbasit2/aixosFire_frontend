import React from 'react';

const SectionHeader = ({ title, subtitle, action }) => (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
    </div>
);

export default SectionHeader;
