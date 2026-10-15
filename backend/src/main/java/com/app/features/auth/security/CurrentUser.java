package com.app.features.auth.security;

import com.app.common.BusinessException;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    private final UserRepository users;
    public CurrentUser(UserRepository users) { this.users = users; }
    public UserAccount get() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) throw BusinessException.forbidden();
        return users.findByEmailIgnoreCase(auth.getName()).filter(AccountRoles::active).orElseThrow(BusinessException::forbidden);
    }
}
