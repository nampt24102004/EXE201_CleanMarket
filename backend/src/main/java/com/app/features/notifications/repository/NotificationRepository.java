package com.app.features.notifications.repository;

import com.app.features.notifications.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    java.util.List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
}