package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    public User registerUser(String email, String rawPassword) {

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        if (!isStrongPassword(rawPassword)) {
            throw new RuntimeException(
                    "Password must be at least 8 characters, include uppercase, lowercase, number, and special character."
            );
        }

        String hashedPassword = passwordEncoder.encode(rawPassword);

        User user = User.builder()
                .email(email)
                .password(hashedPassword)
                .role(User.Role.CLIENT)       // Default role
                .status(User.Status.APPROVED) // Default status
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
                            .role(User.Role.CLIENT)
                            .status(User.Status.APPROVED)
                            .build();
                    return userRepository.save(user);
                });
    }

    public List<User> getAllClients() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.CLIENT)
                .toList();
    }
    private boolean isStrongPassword(String password) {
        if (password == null) return false;
        String pattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$";
        return Pattern.compile(pattern).matcher(password).matches();
    }
}