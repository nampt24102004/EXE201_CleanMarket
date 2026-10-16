package com.app.features.notifications.service;

import com.app.features.auth.entity.UserAccount;
import com.app.features.notifications.enums.NotificationType;
import java.time.Instant;
import java.util.List;

public interface NotificationService {
    record NotificationView(Long id, String type, String title, String message, String link, Instant createdAt, Instant readAt) { }
    record Inbox(long unread, List<NotificationView> items) { }

    /** Saves an in-app notification and emails the recipient once the surrounding transaction commits. */
    void notify(UserAccount recipient, NotificationType type, String title, String message, String link);
    Inbox mine();
    NotificationView markRead(Long id);
    void markAllRead();
}
