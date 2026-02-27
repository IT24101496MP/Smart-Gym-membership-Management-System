package lk.fat2fit.Fat2Fit.Service;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import lk.fat2fit.Fat2Fit.Config.JwtUtil;
import lk.fat2fit.Fat2Fit.DTO.Auth.LoginRequest;
import lk.fat2fit.Fat2Fit.DTO.Auth.LoginResponse;
import lk.fat2fit.Fat2Fit.DTO.Auth.MeResponse;
import lk.fat2fit.Fat2Fit.Entity.Instructor;
import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Entity.Enum.ProfileStatus;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public ResponseEntity<?> login(LoginRequest request) {
        String identifier = request.getIdentifier().trim();

        Optional<User> found = userRepository.findByEmail(identifier);
        if (found.isEmpty()) {
            found = userRepository.findByPhoneNumber(identifier);
        }

        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password.");
        }

        User user = found.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password.");
        }

        if (Boolean.FALSE.equals(user.getIsActive())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Account is inactive. Contact administrator.");
        }

        if (user instanceof Instructor instructor) {
            if (instructor.getStatus() == ProfileStatus.PENDING) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Your account is pending approval. Please wait for administrator approval.");
            }
            if (instructor.getStatus() == ProfileStatus.REJECTED) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Your account application has been rejected. Contact administrator.");
            }
        }

        String role = user.getRole().name();
        return ResponseEntity.ok(new LoginResponse(jwtUtil.generateToken(user.getId(), user.getEmail(), role)));
    }

    public ResponseEntity<?> getMe(String token) {
        if (!jwtUtil.isTokenValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token.");
        }

        int userId = jwtUtil.getUserIdFromToken(token);
        String role = jwtUtil.getRoleFromToken(token);

        return userRepository.findById(userId)
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(
                        new MeResponse(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(), role)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found."));
    }
}
