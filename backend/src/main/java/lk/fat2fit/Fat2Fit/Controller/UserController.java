package lk.fat2fit.Fat2Fit.Controller;

import lk.fat2fit.Fat2Fit.DTO.UserRegisterDTO;
import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Normal registration with email + password
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRegisterDTO dto) {
        try {
            if (!dto.getPassword().equals(dto.getConfirmPassword())) {
                return ResponseEntity.badRequest().body("Passwords do not match");
            }

            User user = userService.registerUser(dto.getEmail(), dto.getPassword());
            return ResponseEntity.ok("User registered with ID: " + user.getId());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Google OAuth
    @PostMapping("/oauth/google")
    public ResponseEntity<?> googleLogin(@RequestBody String email) {
        try {
            User user = userService.registerOrGetOAuthUser(email);
            return ResponseEntity.ok("Google user logged in: " + user.getEmail());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Facebook OAuth
    @PostMapping("/oauth/facebook")
    public ResponseEntity<?> facebookLogin(@RequestBody String email) {
        try {
            User user = userService.registerOrGetOAuthUser(email);
            return ResponseEntity.ok("Facebook user logged in: " + user.getEmail());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}