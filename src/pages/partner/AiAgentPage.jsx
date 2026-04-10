import React from 'react';
import { Bot, BarChart3, Zap, Activity, FileText, TrendingUp, WifiOff } from 'lucide-react';
import ChatMessage from './components/aiAgent/ChatMessage';
import ChatInput from './components/aiAgent/ChatInput';
import InfoCard from './components/aiAgent/InfoCard';

const QUICK_ACTIONS = [
  { label: 'Analyze Inquiries', icon: BarChart3 },
  { label: 'Generate Report', icon: FileText },
  { label: 'Suggest Pricing', icon: TrendingUp },
];

const AiAgentPage = () => {
  return (
    <div className="min-h-screen pb-20 px-4 md:px-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <header className="mb-8 md:mb-10">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-600 border border-primary-500/15 shrink-0">
            <Bot size={28} aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900 tracking-tight">
              AI Agent
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-medium mt-1 max-w-2xl leading-relaxed">
              Smart assistant to help partners manage inquiries and insights
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 md:gap-8 items-stretch">
        {/* Left: chat */}
        <section
          className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-soft-xl overflow-hidden min-h-[480px] lg:min-h-[calc(100vh-11rem)]"
          aria-label="Chat"
        >
          <div className="px-4 py-3 md:px-6 md:py-3.5 border-b border-slate-100 bg-slate-50">
            <p className="text-xs md:text-sm font-bold text-slate-600 text-center">
              AI will be available soon
            </p>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-5 scroll-smooth">
            <ChatMessage role="assistant" message="Hello, how can I assist you today?" />
          </div>

          <div className="border-t border-slate-100 p-4 md:p-5 bg-slate-50/60 shrink-0">
            <ChatInput />
          </div>
        </section>

        {/* Right: sidebar */}
        <aside className="flex flex-col gap-5 md:gap-6" aria-label="AI tools and insights">
          <InfoCard title="Quick Actions" icon={Zap}>
            <div className="flex flex-col gap-2.5">
              {QUICK_ACTIONS.map(({ label, icon: ActionIcon }) => (
                <button
                  key={label}
                  type="button"
                  className="group w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 hover:bg-primary-50/40 hover:border-primary-200/80 transition-all duration-300 hover:shadow-md"
                >
                  <span className="p-2 rounded-xl bg-white border border-slate-100 text-primary-600 group-hover:scale-105 transition-transform">
                    <ActionIcon size={18} />
                  </span>
                  <span className="text-sm font-bold text-slate-800">{label}</span>
                </button>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="Insights" icon={Activity}>
            <ul className="space-y-4">
              <li className="flex justify-between items-center gap-3">
                <span className="text-sm font-semibold text-slate-600">Total Inquiries</span>
                <span className="text-lg font-black text-slate-900 tabular-nums">120</span>
              </li>
              <li className="flex justify-between items-center gap-3 pt-2 border-t border-slate-50">
                <span className="text-sm font-semibold text-slate-600">Pending</span>
                <span className="text-lg font-black text-amber-600 tabular-nums">20</span>
              </li>
              <li className="flex justify-between items-center gap-3 pt-2 border-t border-slate-50">
                <span className="text-sm font-semibold text-slate-600">Completed</span>
                <span className="text-lg font-black text-emerald-600 tabular-nums">100</span>
              </li>
            </ul>
          </InfoCard>

          <InfoCard title="Status" icon={WifiOff}>
            <p className="text-sm font-bold text-slate-600">
              AI Status:{' '}
              <span className="text-slate-900 font-black">Not Connected</span>
            </p>
            <p className="text-xs font-medium text-slate-400 mt-2 leading-relaxed">
              Live assistant features will appear here once your workspace is linked.
            </p>
          </InfoCard>
        </aside>
      </div>
    </div>
  );
};

export default AiAgentPage;
