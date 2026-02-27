package lk.fat2fit.Fat2Fit.Controller;

import lk.fat2fit.Fat2Fit.DTO.UserRegisterDTO;
import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRegisterDTO dto) {
        try {
            User.Role role = User.Role.valueOf(dto.getRole().toUpperCase());
            User user = userService.registerUser(dto.getUsername(), dto.getPassword(), role);
            return ResponseEntity.ok("User registered with ID: " + user.getId());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid role");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Admin approves instructor
    @PostMapping("/approve/{id}")
    public ResponseEntity<?> approveInstructor(@PathVariable Long id) {
        try {
            User user = userService.approveInstructor(id);
            return ResponseEntity.ok("Instructor approved: " + user.getUsername());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/instructors")
    public ResponseEntity<List<User>> getAllInstructors() {
        return ResponseEntity.ok(userService.getAllInstructors());
    }

    @GetMapping("/clients")
    public ResponseEntity<List<User>> getAllClients() {
        return ResponseEntity.ok(userService.getAllClients());
    }
}
