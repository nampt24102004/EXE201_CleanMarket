package com.app.features.user.repository;

import com.app.features.user.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AddressRepository extends JpaRepository<Address, Long> {
    java.util.List<Address> findByUserIdOrderByDefaultAddressDesc(Long userId);
}