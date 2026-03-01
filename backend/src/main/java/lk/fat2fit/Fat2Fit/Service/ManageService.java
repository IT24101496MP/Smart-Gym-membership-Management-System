package lk.fat2fit.Fat2Fit.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import lk.fat2fit.Fat2Fit.DTO.Manage.UserDetailResponse;
import lk.fat2fit.Fat2Fit.DTO.Manage.UserEditRequest;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ManageService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private UserDetailResponse toDetailResponse(User u) {
        return UserDetailResponse.builder()
                .id(u.getId())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .age(u.getAge())
                .dateOfBirth(u.getDateOfBirth())
                .gender(u.getGender())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .landPhone(u.getLandPhone())
                .emergencyContactName(u.getEmergencyContactName())
                .emergencyContactRelationship(u.getEmergencyContactRelationship())
                .emergencyContactNumber(u.getEmergencyContactNumber())
                .bloodGroup(u.getBloodGroup())
                .address(u.getAddress())
                .role(u.getRole())
                .isActive(u.getIsActive())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }

    private void applyEdits(User user, UserEditRequest req, boolean allowIsActive) {
        if (req.getFirstName() != null && !req.getFirstName().isBlank())
            user.setFirstName(req.getFirstName().trim());
        if (req.getLastName() != null && !req.getLastName().isBlank())
            user.setLastName(req.getLastName().trim());
        if (req.getAge() != null && req.getAge() > 0)
            user.setAge(req.getAge());
        if (req.getDateOfBirth() != null)
            user.setDateOfBirth(req.getDateOfBirth());
        if (req.getGender() != null)
            user.setGender(req.getGender());
        if (req.getEmail() != null && !req.getEmail().isBlank())
            user.setEmail(req.getEmail().trim());
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank())
            user.setPhoneNumber(req.getPhoneNumber().trim());
        if (req.getAddress() != null && !req.getAddress().isBlank())
            user.setAddress(req.getAddress().trim());
        // Optional fields — allow explicit null/blank to clear them
        user.setLandPhone(emptyToNull(req.getLandPhone()));
        user.setEmergencyContactName(emptyToNull(req.getEmergencyContactName()));
        user.setEmergencyContactRelationship(emptyToNull(req.getEmergencyContactRelationship()));
        user.setEmergencyContactNumber(emptyToNull(req.getEmergencyContactNumber()));
        user.setBloodGroup(emptyToNull(req.getBloodGroup()));
        if (allowIsActive && req.getIsActive() != null)
            user.setIsActive(req.getIsActive());
    }

    private String emptyToNull(String v) {
        return (v == null || v.trim().isEmpty()) ? null : v.trim();
    }

    // ── Admin: get all users except self ──────────────────────────────────────

    public ResponseEntity<?> getAllUsersExceptSelf() {
        int selfId = getCurrentUser().getId();
        List<UserDetailResponse> list = userRepository.findAll()
                .stream()
                .filter(u -> u.getId() != selfId)
                .map(this::toDetailResponse)
                .toList();
        return ResponseEntity.ok(list);
    }

    // ── Admin / Instructor: get all clients ───────────────────────────────────

    public ResponseEntity<?> getAllClients() {
        List<UserDetailResponse> list = clientRepository.findAll()
                .stream()
                .map(this::toDetailResponse)
                .toList();
        return ResponseEntity.ok(list);
    }

    // ── Admin: edit any user's details (role excluded) ────────────────────────

    public ResponseEntity<?> editUser(int targetId, UserEditRequest req) {
        int selfId = getCurrentUser().getId();
        if (targetId == selfId) {
            return ResponseEntity.badRequest().body("Use /api/manage/me to edit your own account.");
        }

        Optional<User> userOpt = userRepository.findById(targetId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found.");
        }

        User user = userOpt.get();

        // Validate email uniqueness if changing
        if (req.getEmail() != null && !req.getEmail().equalsIgnoreCase(user.getEmail())
                && userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already in use.");
        }
        // Validate phone uniqueness if changing
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().equals(user.getPhoneNumber())
                && userRepository.existsByPhoneNumber(req.getPhoneNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Phone number already in use.");
        }

        applyEdits(user, req, true);
        userRepository.save(user);
        return ResponseEntity.ok(toDetailResponse(user));
    }

    // ── Admin / Instructor: edit a client's details ────────────────────────────

    public ResponseEntity<?> editClient(int clientId, UserEditRequest req) {
        Optional<Client> clientOpt = clientRepository.findById(clientId);
        if (clientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found.");
        }

        Client client = clientOpt.get();

        if (req.getEmail() != null && !req.getEmail().equalsIgnoreCase(client.getEmail())
                && userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already in use.");
        }
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().equals(client.getPhoneNumber())
                && userRepository.existsByPhoneNumber(req.getPhoneNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Phone number already in use.");
        }

        applyEdits(client, req, true);
        clientRepository.save(client);
        return ResponseEntity.ok(toDetailResponse(client));
    }

    // ── Client: edit own personal details ─────────────────────────────────────

    public ResponseEntity<?> editSelf(UserEditRequest req) {
        User self = getCurrentUser();

        if (req.getEmail() != null && !req.getEmail().equalsIgnoreCase(self.getEmail())
                && userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already in use.");
        }
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().equals(self.getPhoneNumber())
                && userRepository.existsByPhoneNumber(req.getPhoneNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Phone number already in use.");
        }

        applyEdits(self, req, false); // client cannot toggle isActive on themselves
        userRepository.save(self);
        return ResponseEntity.ok(toDetailResponse(self));
    }

    // ── Get own details (used by all roles on /manage) ───────────────────────

    public ResponseEntity<?> getSelf() {
        return ResponseEntity.ok(toDetailResponse(getCurrentUser()));
    }
}
