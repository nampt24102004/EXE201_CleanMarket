package com.app.features.admin.repository;

import com.app.features.admin.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {
    java.util.Optional<SystemSetting> findByKey(String key);
}