package com.app.features.user.serviceimpl;

import com.app.common.ApiResponse;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.repository.UserRepository;
import com.app.features.auth.security.CurrentUser;
import com.app.features.user.dto.ProfileControllerDto.ProfileView;
import com.app.features.user.dto.ProfileControllerDto.UpdateRequest;
import com.app.features.user.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service public class ProfileServiceImpl implements ProfileService {
    private final CurrentUser current; private final UserRepository users;
    public ProfileServiceImpl(CurrentUser current, UserRepository users) { this.current = current; this.users = users; }
    public ApiResponse<ProfileView> get() { return ApiResponse.ok(view(current.get())); }
    @Transactional public ApiResponse<ProfileView> update(@Valid UpdateRequest request) { UserAccount user = current.get(); user.setFullName(request.fullName().trim()); users.save(user); return ApiResponse.ok(view(user)); }
    private ProfileView view(UserAccount user) { return new ProfileView(user.getId(), user.getEmail(), user.getFullName()); }
}
