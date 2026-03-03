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
import lk.fat2fit.Fat2Fit.DTO.Auth.RefreshRequest;
import lk.fat2fit.Fat2Fit.Entity.Instructor;
import lk.fat2fit.Fat2Fit.Entity.RefreshToken;
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
    private final RefreshTokenService refreshTokenService;

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
        String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), role);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        return ResponseEntity.ok(new LoginResponse(accessToken, refreshToken.getToken()));
    }

    public ResponseEntity<?> refresh(RefreshRequest request) {
        Optional<RefreshToken> tokenOpt = refreshTokenService.validateRefreshToken(request.getRefreshToken());
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Refresh token is invalid or expired. Please log in again.");
        }
        RefreshToken rt = tokenOpt.get();
        User user = rt.getUser();
        String role = user.getRole().name();
        String newAccessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), role);
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);
        return ResponseEntity.ok(new LoginResponse(newAccessToken, newRefreshToken.getToken()));
    }

    public ResponseEntity<?> logout(RefreshRequest request) {
        refreshTokenService.revokeToken(request.getRefreshToken());
        return ResponseEntity.ok("Logged out successfully.");
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
