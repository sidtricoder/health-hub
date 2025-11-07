'use client';

import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, AlertCircle, Info, Heart, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/types';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'report_ready':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'medication_reminder':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'patient_update':
        return <Info className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-gray-50"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center bg-red-500 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    onClick={onMarkAllAsRead}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors relative group ${
                        !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.isRead && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsRead(notification.id);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDismiss(notification.id);
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 5 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: Navigate to notifications page
                  }}
                >
                  View all notifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}