"use client";

import { useNotificationStore } from "@/lib/notification-store";
import { Notification, NotificationContainer } from "@/components/ui/notification";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <>
      {children}
      <NotificationContainer>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            id={notification.id}
            title={notification.title}
            message={notification.message}
            type={notification.type}
            action={notification.action}
            onDismiss={removeNotification}
          />
        ))}
      </NotificationContainer>
    </>
  );
}
