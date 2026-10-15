package com.app.features.user.serviceimpl;

import com.app.common.ApiResponse;
import com.app.common.BusinessException;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.repository.UserRepository;
import com.app.features.auth.security.CurrentUser;
import com.app.features.user.dto.ProfileControllerDto.*;
import com.app.features.user.entity.Address;
import com.app.features.user.repository.AddressRepository;
import com.app.features.user.service.ProfileService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service public class ProfileServiceImpl implements ProfileService {
    private static final int MAX_ADDRESSES = 10;
    private final CurrentUser current; private final UserRepository users; private final AddressRepository addresses; private final PasswordEncoder passwords; private final AuditService audit;
    public ProfileServiceImpl(CurrentUser current, UserRepository users, AddressRepository addresses, PasswordEncoder passwords, AuditService audit) {
        this.current = current; this.users = users; this.addresses = addresses; this.passwords = passwords; this.audit = audit;
    }

    public ApiResponse<ProfileView> get() { return ApiResponse.ok(view(current.get())); }

    @Transactional public ApiResponse<ProfileView> update(@Valid UpdateRequest request) {
        UserAccount user = current.get(); user.setFullName(request.fullName().trim());
        if (request.phone() != null) user.setPhone(request.phone().isBlank() ? null : request.phone().trim());
        users.save(user); return ApiResponse.ok(view(user));
    }

    @Transactional public ApiResponse<Void> changePassword(@Valid ChangePasswordRequest request) {
        UserAccount user = current.get();
        if (!passwords.matches(request.currentPassword(), user.getPasswordHash())) throw BusinessException.bad("WRONG_PASSWORD", "Mật khẩu hiện tại không đúng");
        if (passwords.matches(request.newPassword(), user.getPasswordHash())) throw BusinessException.bad("SAME_PASSWORD", "Mật khẩu mới phải khác mật khẩu hiện tại");
        user.setPasswordHash(passwords.encode(request.newPassword())); users.save(user);
        audit.record(user, "PASSWORD_CHANGED", "UserAccount", user.getId(), null);
        return ApiResponse.ok(null, "Đổi mật khẩu thành công");
    }

    @Transactional(readOnly = true) public ApiResponse<List<AddressView>> addresses() {
        return ApiResponse.ok(addresses.findByUserIdOrderByDefaultAddressDesc(current.get().getId()).stream().map(this::view).toList());
    }

    @Transactional public ApiResponse<AddressView> addAddress(@Valid AddressRequest request) {
        UserAccount user = current.get(); List<Address> mine = addresses.findByUserIdOrderByDefaultAddressDesc(user.getId());
        if (mine.size() >= MAX_ADDRESSES) throw BusinessException.bad("ADDRESS_LIMIT", "Chỉ lưu được tối đa " + MAX_ADDRESSES + " địa chỉ");
        Address a = new Address(); a.setUser(user); fill(a, request);
        // The first saved address becomes the default so checkout always has something to prefill.
        boolean makeDefault = request.defaultAddress() || mine.isEmpty();
        if (makeDefault) mine.forEach(other -> other.setDefaultAddress(false));
        a.setDefaultAddress(makeDefault); addresses.save(a);
        return ApiResponse.ok(view(a));
    }

    @Transactional public ApiResponse<AddressView> updateAddress(Long id, @Valid AddressRequest request) {
        Address a = owned(id); fill(a, request);
        if (request.defaultAddress() && !a.isDefaultAddress()) {
            addresses.findByUserIdOrderByDefaultAddressDesc(a.getUser().getId()).forEach(other -> other.setDefaultAddress(false));
            a.setDefaultAddress(true);
        }
        return ApiResponse.ok(view(a));
    }

    @Transactional public ApiResponse<Void> deleteAddress(Long id) {
        Address a = owned(id); boolean wasDefault = a.isDefaultAddress(); Long userId = a.getUser().getId(); addresses.delete(a); addresses.flush();
        if (wasDefault) addresses.findByUserIdOrderByDefaultAddressDesc(userId).stream().findFirst().ifPresent(next -> next.setDefaultAddress(true));
        return ApiResponse.ok(null);
    }

    private Address owned(Long id) { return addresses.findById(id).filter(a -> a.getUser().getId().equals(current.get().getId())).orElseThrow(() -> BusinessException.missing("Địa chỉ")); }
    private void fill(Address a, AddressRequest r) { a.setRecipientName(r.recipientName().trim()); a.setPhone(r.phone().trim()); a.setAddressLine(r.addressLine().trim()); }
    private ProfileView view(UserAccount user) { return new ProfileView(user.getId(), user.getEmail(), user.getFullName(), user.getPhone(), user.getRole()); }
    private AddressView view(Address a) { return new AddressView(a.getId(), a.getRecipientName(), a.getPhone(), a.getAddressLine(), a.isDefaultAddress()); }
}
