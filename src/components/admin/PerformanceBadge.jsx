import React from 'react';

const tiers = {
    excellent: { label: 'Excellent', cls: 'bg-emerald-100 text-emerald-700' },
    good:      { label: 'Good',      cls: 'bg-blue-100 text-blue-700' },
    average:   { label: 'Average',   cls: 'bg-amber-100 text-amber-800' },
    poor:      { label: 'Poor',      cls: 'bg-red-100 text-red-700' },
};

const PerformanceBadge = ({ score }) => {
    const key = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'average' : 'poor';
    const { label, cls } = tiers[key];
    return <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${cls}`}>{label}</span>;
};

export default PerformanceBadge;
