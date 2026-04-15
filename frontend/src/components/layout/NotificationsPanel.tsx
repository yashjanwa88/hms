import { useState } from 'react';
import { Bell, Check, CheckCheck, X, AlertCircle, Calendar, FileText, Pill, DollarSign, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'appointment' | 'report' | 'payment' | 'alert' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'appointment',
    title: 'New Appointment Booked',
    message: 'John Doe has booked an appointment with Dr. Smith for tomorrow at 10:00 AM',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
  },
  {
    id: '2',
    type: 'report',
    title: 'Lab Report Ready',
    message: 'Blood test report for Jane Smith is ready for review',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment Received',
    message: '₹1,500 received from Alice Brown for Invoice #INV-2024-001',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: '4',
    type: 'alert',
    title: 'Low Stock Alert',
    message: 'Paracetamol 500mg stock is below minimum level (5 remaining)',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: false,
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Appointment Reminder',
    message: 'Bob Johnson has an appointment in 1 hour with Dr. Williams',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: true,
  },
];

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'report': return <FileText className="h-4 w-4 text-green-500" />;
      case 'payment': return <DollarSign className="h-4 w-4 text-emerald-500" />;
      case 'alert': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'reminder': return <Clock className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="p-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Bell className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs mt-1">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex gap-3 p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className="shrink-0">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${notification.read ? 'text-slate-600 dark:text-slate-400' : 'font-semibold text-slate-900 dark:text-white'}`}>
                          {notification.title}
                        </p>
                        <button
                          onClick={() => dismissNotification(notification.id)}
                          className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-slate-400">
                          {getTimeAgo(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-[10px] text-primary hover:text-primary/80 font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs font-bold uppercase tracking-wider">
                  <CheckCheck className="h-4 w-4" />
                  View All Notifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}