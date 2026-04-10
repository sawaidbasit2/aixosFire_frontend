import React from 'react';
import { Sparkles, User } from 'lucide-react';

/**
 * @param {'assistant' | 'user'} props.role
 * @param {string} props.message
 */
const ChatMessage = ({ role = 'assistant', message }) => {
  const isAssistant = role === 'assistant';

  return (
    <div
      className={`flex w-full gap-3 animate-in fade-in duration-300 ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      {isAssistant && (
        <div
          className="shrink-0 w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 border border-primary-500/15"
          aria-hidden
        >
          <Sparkles size={18} />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border ${
          isAssistant
            ? 'bg-slate-50 text-slate-800 border-slate-100'
            : 'bg-primary-600 text-white border-primary-500'
        }`}
      >
        <p className="font-medium">{message}</p>
      </div>
      {!isAssistant && (
        <div
          className="shrink-0 w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 border border-slate-100"
          aria-hidden
        >
          <User size={18} />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
