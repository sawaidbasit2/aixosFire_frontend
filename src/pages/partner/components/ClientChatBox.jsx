import React, { useState, useRef, useEffect } from 'react';
import { Send, User, MessageCircle, MoreVertical } from 'lucide-react';

const ClientChatBox = ({ initialMessages = [] }) => {
    const [messages, setMessages] = useState(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msg = {
            id: Date.now(),
            sender: 'Partner',
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, msg]);
        setNewMessage('');

    };

    return (
        <div className="bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden flex flex-col h-[450px] shadow-inner-sm">
            {/* Header */}
            <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                        <MessageCircle size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900">Client Discussion</h4>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Now</p>
                        </div>
                    </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                    <MoreVertical size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <MessageCircle size={48} className="text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No messages yet</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'Partner' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className={`max-w-[80%] ${msg.sender === 'Partner' ? 'order-2' : ''}`}>
                                <div className={`flex items-center gap-2 mb-1 ${msg.sender === 'Partner' ? 'justify-end' : 'justify-start'}`}>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.sender}</p>
                                    <p className="text-[10px] font-bold text-slate-300">{msg.time}</p>
                                </div>
                                <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${msg.sender === 'Partner'
                                        ? 'bg-slate-900 text-white rounded-tr-none'
                                        : 'bg-white text-slate-700 border border-slate-100 shadow-sm rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
                <button
                    type="submit"
                    className="bg-primary-500 hover:bg-primary-600 text-white p-3 rounded-xl shadow-primary transition-all active:scale-95"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ClientChatBox;
