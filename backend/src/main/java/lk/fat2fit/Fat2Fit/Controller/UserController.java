package lk.fat2fit.Fat2Fit.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lk.fat2fit.Fat2Fit.DTO.User.SwitchRoleRequest;
import lk.fat2fit.Fat2Fit.Service.UserService;
import lombok.RequiredArgsConstructor;
import lk.fat2fit.Fat2Fit.DTO.UserRegisterDTO;
import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * GET /api/user
     * Returns a list of all registered users with their roles.
     * Access: ADMIN only (enforced in SecurityConfig).
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        return userService.getAllUsers();
    }

    /**
     * PUT /api/user/{id}/role
     * Switches a user's role without any data loss.
     * The Client / Instructor subclass rows are preserved; only the role column changes.
     * Access: ADMIN only (enforced in SecurityConfig).
     */
    @PutMapping("/{id}/role")
    public ResponseEntity<?> switchRole(@PathVariable int id,
                                        @RequestBody SwitchRoleRequest request) {
        return userService.switchRole(id, request);
    }

    private Map<String, Object> buildUserResponse(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("userId", user.getId());
        response.put("email", user.getEmail());
        response.put("role", user.getRole().name());
        return response;
    }

    // Normal registration with email + password
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRegisterDTO dto) {
        try {
            if (!dto.getPassword().equals(dto.getConfirmPassword())) {
                return ResponseEntity.badRequest().body("Passwords do not match");
            }

            User user = userService.registerUser(dto.getEmail(), dto.getPassword(), dto.getRole());
            return ResponseEntity.ok(buildUserResponse(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Google OAuth
    @PostMapping("/oauth/google")
    public ResponseEntity<?> googleLogin(@RequestBody String email) {
        try {
            User user = userService.registerOrGetOAuthUser(email);
            return ResponseEntity.ok(buildUserResponse(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Facebook OAuth
    @PostMapping("/oauth/facebook")
    public ResponseEntity<?> facebookLogin(@RequestBody String email) {
        try {
            User user = userService.registerOrGetOAuthUser(email);
            return ResponseEntity.ok(buildUserResponse(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
