// Notifications hook for user feedback
import { useState, useCallback, useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number; // milliseconds
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationsHook {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showSuccess: (title: string, message?: string) => string;
  showError: (title: string, message?: string, action?: Notification['action']) => string;
  showWarning: (title: string, message?: string) => string;
  showInfo: (title: string, message?: string) => string;
}

export function useNotifications(): NotificationsHook {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Auto-remove notifications that have expired
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => prev.filter(notification => {
        if (!notification.autoClose) return true;
        
        const duration = notification.duration || 5000;
        const elapsed = Date.now() - notification.timestamp.getTime();
        return elapsed < duration;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substring(2, 15);
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      autoClose: notification.autoClose !== false, // Default to true
      duration: notification.duration || 5000,
    };

    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for common notification types
  const showSuccess = useCallback((title: string, message = '') => {
    return addNotification({
      type: 'success',
      title,
      message,
      autoClose: true,
      duration: 4000,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message = '', action?: Notification['action']) => {
    return addNotification({
      type: 'error',
      title,
      message,
      autoClose: false, // Error notifications should stay until manually dismissed
      action,
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message = '') => {
    return addNotification({
      type: 'warning',
      title,
      message,
      autoClose: true,
      duration: 6000,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message = '') => {
    return addNotification({
      type: 'info',
      title,
      message,
      autoClose: true,
      duration: 4000,
    });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}

// Hook for service-specific notifications
export function useServiceNotifications() {
  const { showSuccess, showError, showInfo } = useNotifications();

  const notifyServiceStarted = useCallback((serviceName: string, action: 'generation' | 'regeneration') => {
    return showInfo(
      `${serviceName} ${action} started`,
      `Processing your request, please wait...`
    );
  }, [showInfo]);

  const notifyServiceSuccess = useCallback((serviceName: string, action: 'generation' | 'regeneration') => {
    return showSuccess(
      `${serviceName} ${action} completed`,
      `Your images are ready!`
    );
  }, [showSuccess]);

  const notifyServiceError = useCallback((
    serviceName: string, 
    action: 'generation' | 'regeneration', 
    error: string,
    retryFn?: () => void
  ) => {
    return showError(
      `${serviceName} ${action} failed`,
      error,
      retryFn ? { label: 'Retry', onClick: retryFn } : undefined
    );
  }, [showError]);

  const notifyMultipleServicesStarted = useCallback((services: string[]) => {
    return showInfo(
      'Generation started',
      `Running ${services.join(', ')} services...`
    );
  }, [showInfo]);

  const notifyAllServicesCompleted = useCallback((successCount: number, totalCount: number) => {
    if (successCount === totalCount) {
      return showSuccess(
        'All services completed',
        `${successCount} of ${totalCount} services generated successfully!`
      );
    } else {
      return showError(
        'Some services failed',
        `${successCount} of ${totalCount} services completed successfully`
      );
    }
  }, [showSuccess, showError]);

  return {
    notifyServiceStarted,
    notifyServiceSuccess,
    notifyServiceError,
    notifyMultipleServicesStarted,
    notifyAllServicesCompleted,
  };
}