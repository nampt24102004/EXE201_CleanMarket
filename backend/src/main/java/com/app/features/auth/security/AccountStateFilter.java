package com.app.features.auth.security;

import com.app.features.auth.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Re-checks the session's account on every request: a locked, unverified or deleted account loses its session
 * immediately, and a role change made by an admin applies without waiting for the user to log in again.
 */
public class AccountStateFilter extends OncePerRequestFilter {
    private final UserRepository users;
    private final AccountRoles roles;
    private final HttpSessionSecurityContextRepository contexts = new HttpSessionSecurityContextRepository();

    public AccountStateFilter(UserRepository users, AccountRoles roles) { this.users = users; this.roles = roles; }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof UsernamePasswordAuthenticationToken && auth.isAuthenticated()) {
            var account = users.findByEmailIgnoreCase(auth.getName()).filter(AccountRoles::active);
            if (account.isEmpty()) {
                SecurityContextHolder.clearContext();
                var session = request.getSession(false);
                if (session != null) session.invalidate();
            } else {
                Set<String> current = new HashSet<>(auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList());
                List<SimpleGrantedAuthority> fresh = roles.of(account.get()).stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList();
                if (!current.equals(new HashSet<>(fresh.stream().map(SimpleGrantedAuthority::getAuthority).toList()))) {
                    var context = SecurityContextHolder.createEmptyContext();
                    context.setAuthentication(new UsernamePasswordAuthenticationToken(auth.getName(), null, fresh));
                    SecurityContextHolder.setContext(context);
                    contexts.saveContext(context, request, response);
                }
            }
        }
        chain.doFilter(request, response);
    }
}
