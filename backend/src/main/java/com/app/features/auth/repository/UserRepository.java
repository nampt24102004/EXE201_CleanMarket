package com.app.features.auth.repository;

import com.app.features.auth.entity.UserAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserAccount, Long> { Optional<UserAccount> findByEmailIgnoreCase(String email); boolean existsByEmailIgnoreCase(String email); }
