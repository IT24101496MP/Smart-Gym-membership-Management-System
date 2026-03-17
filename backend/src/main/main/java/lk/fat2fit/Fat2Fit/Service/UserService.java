package lk.fat2fit.Fat2Fit.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import lk.fat2fit.Fat2Fit.DTO.User.SwitchRoleRequest;
import lk.fat2fit.Fat2Fit.DTO.User.UserSummaryResponse;
import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;
import lk.fat2fit.Fat2Fit.Entity.Enum.Role;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final  PasswordEncoder passwordEncoder;

    /**
     * Returns a summary of every registered user (id, name, email, role, status).
     */
    public ResponseEntity<?> getAllUsers() {
        List<UserSummaryResponse> users = userRepository.findAll()
                .stream()
                .map(u -> new UserSummaryResponse(
                        u.getId(),
                        u.getFirstName(),
                        u.getLastName(),
                        u.getEmail(),
                        u.getPhoneNumber(),
                        u.getRole(),
                        u.getIsActive(),
                        u.getCreatedAt()
                ))
                .toList();
        return ResponseEntity.ok(users);
    }

    /**
     * Switches a user's role without deleting any associated Client / Instructor data.
     * Only the 'role' column on the User record is updated — all other tables remain intact.
     */
    public ResponseEntity<?> switchRole(int userId, SwitchRoleRequest request) {
        if (request.getRole() == null) {
            return ResponseEntity.badRequest().body("Role must not be null.");
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found.");
        }

        User user = userOpt.get();

        if (user.getRole() == request.getRole()) {
            return ResponseEntity.ok("User already has role: " + request.getRole());
        }

        user.setRole(request.getRole());
        userRepository.save(user);

        return ResponseEntity.ok(new UserSummaryResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole(),
                user.getIsActive(),
                user.getCreatedAt()
        ));
    }

    public User registerUser(String email, String rawPassword, String roleString) {

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        if (!isStrongPassword(rawPassword)) {
            throw new RuntimeException(
                    "Password must be at least 8 characters, include uppercase, lowercase, number, and special character."
            );
        }

        String hashedPassword = passwordEncoder.encode(rawPassword);

        // Parse role string
        Role role = Role.CLIENT;
        if (roleString != null && !roleString.trim().isEmpty()) {
            try {
                role = Role.valueOf(roleString.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid role: " + roleString);
            }
        }

        User user = User.builder()
                .email(email)
                .password(hashedPassword)
                .role(role)
                .build();

        return userRepository.save(user);
    }

    // Google/Facebook OAuth registration or get existing user
    public User registerOrGetOAuthUser(String email) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User user = User.builder()
                            .email(email)
                            .password("")
                            .role(Role.CLIENT)
                            .build();
                    return userRepository.save(user);
                });
    }

    public List<User> getAllClients() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.CLIENT)
                .toList();
    }
    private boolean isStrongPassword(String password) {
        if (password == null) return false;
        String pattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$";
        return Pattern.compile(pattern).matcher(password).matches();
    }
}
