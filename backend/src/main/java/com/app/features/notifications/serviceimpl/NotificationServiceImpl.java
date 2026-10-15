package com.app.features.notifications.serviceimpl;

import com.app.common.BusinessException;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.security.CurrentUser;
import com.app.features.notifications.dto.MailEventDto.NoticeMailEvent;
import com.app.features.notifications.entity.Notification;
import com.app.features.notifications.enums.NotificationType;
import com.app.features.notifications.repository.NotificationRepository;
import com.app.features.notifications.service.NotificationService;
import java.time.Instant;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notifications; private final CurrentUser current; private final ApplicationEventPublisher events;
    public NotificationServiceImpl(NotificationRepository notifications, CurrentUser current, ApplicationEventPublisher events) {
        this.notifications = notifications; this.current = current; this.events = events;
    }

    @Override @Transactional
    public void notify(UserAccount recipient, NotificationType type, String title, String message, String link) {
        Notification n = new Notification(); n.setRecipient(recipient); n.setType(type); n.setTitle(title); n.setMessage(message); n.setLink(link);
        notifications.save(n);
        events.publishEvent(new NoticeMailEvent(recipient.getEmail(), recipient.getFullName(), title, message, link));
    }

    @Override @Transactional(readOnly = true)
    public Inbox mine() {
        Long me = current.get().getId();
        return new Inbox(notifications.countByRecipientIdAndReadAtIsNull(me), notifications.findTop50ByRecipientIdOrderByCreatedAtDesc(me).stream().map(this::view).toList());
    }

    @Override @Transactional
    public NotificationView markRead(Long id) {
        Notification n = notifications.findById(id).filter(x -> x.getRecipient().getId().equals(current.get().getId())).orElseThrow(() -> BusinessException.missing("Thông báo"));
        if (n.getReadAt() == null) n.setReadAt(Instant.now());
        return view(n);
    }

    @Override @Transactional
    public void markAllRead() { notifications.markAllRead(current.get().getId(), Instant.now()); }

    private NotificationView view(Notification n) { return new NotificationView(n.getId(), n.getType().name(), n.getTitle(), n.getMessage(), n.getLink(), n.getCreatedAt(), n.getReadAt()); }
}
