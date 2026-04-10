import React, { useState } from 'react';
import { Send } from 'lucide-react';

/**
 * Placeholder input; send is intentionally non-functional until API is wired.
 */
const ChatInput = ({
  placeholder = 'Ask something...',
  disabled = false,
}) => {
  const [value, setValue] = useState('');

  return (
    <div className="flex items-end gap-2 md:gap-3">
      <label className="sr-only" htmlFor="ai-agent-chat-input">
        Message
      </label>
      <textarea
        id="ai-agent-chat-input"
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="input-field flex-1 min-h-[48px] max-h-28 py-3 px-4 rounded-2xl text-sm resize-none border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        title="Send (coming soon)"
        disabled={disabled}
        onClick={(e) => e.preventDefault()}
        className="shrink-0 h-12 w-12 md:w-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-500/25 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
        aria-label="Send message (not connected yet)"
      >
        <Send size={20} className="md:w-[22px] md:h-[22px]" />
      </button>
    </div>
  );
};

export default ChatInput;
