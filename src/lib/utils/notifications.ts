// User notifications utility
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // milliseconds, undefined = persistent
  timestamp: Date;
}

class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: Set<(notifications: Notification[]) => void> = new Set();

  add(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date()
    };

    this.notifications = [...this.notifications, newNotification];
    this.notifyListeners();

    // Auto-remove after duration
    if (newNotification.duration) {
      setTimeout(() => this.remove(id), newNotification.duration);
    }

    return id;
  }

  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  clear(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  getAll(): Notification[] {
    return [...this.notifications];
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();

// Convenience methods
export const showSuccess = (title: string, message: string, duration = 5000) => {
  return notificationManager.add({ type: 'success', title, message, duration });
};

export const showError = (title: string, message: string, duration?: number) => {
  return notificationManager.add({ type: 'error', title, message, duration });
};

export const showWarning = (title: string, message: string, duration = 7000) => {
  return notificationManager.add({ type: 'warning', title, message, duration });
};

export const showInfo = (title: string, message: string, duration = 5000) => {
  return notificationManager.add({ type: 'info', title, message, duration });
};

// Service-specific notification helpers
export const showServiceSuccess = (service: string, action: string) => {
  return showSuccess(
    'Generation Complete',
    `${service.toUpperCase()} ${action} completed successfully`,
    5000
  );
};

export const showServiceError = (service: string, action: string, error: string) => {
  return showError(
    'Generation Failed',
    `${service.toUpperCase()} ${action} failed: ${error}`
  );
};

export const showServiceStarted = (service: string, action: string) => {
  return showInfo(
    'Generation Started',
    `${service.toUpperCase()} ${action} has been started`,
    3000
  );
};

// TODO: Add toast component integration
// TODO: Add notification persistence
// TODO: Add notification grouping