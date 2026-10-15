package com.app.features.auth.repository;

import com.app.features.auth.entity.UserAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserAccount, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<UserAccount> { Optional<UserAccount> findByEmailIgnoreCase(String email); boolean existsByEmailIgnoreCase(String email); long countByLockedTrue(); java.util.List<UserAccount> findByRoleInAndLockedFalse(java.util.Collection<String> roles); long countByCreatedAtAfter(java.time.Instant since); }
