import React from 'react';

/**
 * Sidebar / dashboard-style card matching partner pages.
 */
const InfoCard = ({ title, icon: Icon, children, className = '' }) => {
  return (
    <div
      className={`bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden transition-shadow duration-300 hover:shadow-lg ${className}`}
    >
      {(title || Icon) && (
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
          {Icon && (
            <div className="p-2 rounded-xl bg-primary-500/10 text-primary-600">
              <Icon size={18} />
            </div>
          )}
          {title && (
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">{title}</h2>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

export default InfoCard;
