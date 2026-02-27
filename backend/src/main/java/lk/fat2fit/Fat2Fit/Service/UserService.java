package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User registerUser(String username, String rawPassword, User.Role role) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }

        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            throw new RuntimeException("Password cannot be empty");
        }

        String hashedPassword = passwordEncoder.encode(rawPassword);


        User.Status status = (role == User.Role.INSTRUCTOR) ? User.Status.PENDING : User.Status.APPROVED;

        User user = User.builder()
                .username(username)
                .password(hashedPassword)
                .role(role)
                .status(status)
                .build();

        return userRepository.save(user);
    }

    public User approveInstructor(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != User.Role.INSTRUCTOR) {
            throw new RuntimeException("User is not an instructor");
        }

        user.setStatus(User.Status.APPROVED);
        return userRepository.save(user);
    }

    public List<User> getAllInstructors() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.INSTRUCTOR)
                .toList();
    }

    public List<User> getAllClients() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.CLIENT)
                .toList();
    }
}