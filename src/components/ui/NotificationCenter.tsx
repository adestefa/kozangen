// Notification Center component for displaying user notifications
'use client';

import { useNotifications, Notification, NotificationType } from '@/hooks/useNotifications';
import { useState, useEffect } from 'react';

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const getNotificationStyles = (type: NotificationType) => {
    const baseStyles = "border rounded-lg shadow-lg backdrop-blur-sm";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-200 text-gray-800`;
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-green-600" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-red-600" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-5 h-5 rounded-full bg-yellow-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-yellow-600" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-blue-600" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div 
      className={`
        ${getNotificationStyles(notification.type)}
        p-4 max-w-sm transition-all duration-300 ease-in-out
        ${isVisible && !isExiting ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {getIconForType(notification.type)}
          <div className="flex-1">
            <h4 className="text-sm font-medium">{notification.title}</h4>
            {notification.message && (
              <p className="text-sm opacity-90 mt-1">{notification.message}</p>
            )}
            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className="text-sm font-medium underline mt-2 hover:no-underline transition-all"
              >
                {notification.action.label}
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {notification.autoClose && notification.duration && (
        <div className="mt-3">
          <div 
            className="h-1 bg-current opacity-20 rounded-full overflow-hidden"
            style={{
              animation: `shrink ${notification.duration}ms linear`
            }}
          >
            <div 
              className="h-full bg-current opacity-60"
              style={{
                animation: `shrink ${notification.duration}ms linear`
              }}
            />
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export default function NotificationCenter() {
  const { notifications, removeNotification, clearAllNotifications } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* Notification Portal - Fixed position overlay */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={removeNotification}
          />
        ))}
        
        {/* Clear All Button - Show when there are multiple notifications */}
        {notifications.length > 1 && (
          <div className="flex justify-end pt-2">
            <button
              onClick={clearAllNotifications}
              className="text-xs text-gray-600 hover:text-gray-800 underline transition-colors"
            >
              Clear all ({notifications.length})
            </button>
          </div>
        )}
      </div>
    </>
  );
}