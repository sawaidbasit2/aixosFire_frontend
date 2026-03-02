import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, Clock, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NotificationBell = ({ onOpenChat }) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    // Mock data for notifications - In a real app, this would come from an API/Supabase
    useEffect(() => {
        const mockNotifications = [
            {
                id: 1,
                title: 'New Message',
                message: 'Agent Hassan sent you a message regarding Extinguisher #5421',
                type: 'message',
                relatedId: '5421', // Extinguisher ID for chat
                timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
                isRead: false
            },
            {
                id: 2,
                title: 'New Inquiry',
                message: 'A new maintenance inquiry has been generated for Client ABC',
                type: 'inquiry',
                relatedId: 'inq_123',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
                isRead: true
            }
        ];

        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const markAsRead = (id) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    const removeNotification = (id, e) => {
        e.stopPropagation();
        const notification = notifications.find(n => n.id === id);
        if (!notification.isRead) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        if (notification.type === 'message' && onOpenChat) {
            onOpenChat(notification.relatedId);
        }
        setIsOpen(false);
    };

    const formatTimestamp = (isoString) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffInMins = Math.floor((now - date) / (1000 * 60));

        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="relative p-2 text-slate-500 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-all duration-200"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-primary-500 hover:text-primary-600 font-bold flex items-center gap-1"
                            >
                                <Check size={14} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer group flex gap-3 ${!notification.isRead ? 'bg-primary-50/30' : ''}`}
                                    >
                                        <div className={`mt-1 p-2 rounded-xl flex-shrink-0 ${notification.type === 'message' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                                            }`}>
                                            {notification.type === 'message' ? <MessageSquare size={18} /> : <Clock size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <p className={`text-sm font-bold truncate ${!notification.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                                                    {formatTimestamp(notification.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {notification.message}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => removeNotification(notification.id, e)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <Bell size={32} />
                                </div>
                                <p className="text-slate-500 font-medium">No new notifications</p>
                                <p className="text-xs text-slate-400 mt-1">We'll alert you when something happens</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
                        <button className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                            View All History
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
