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
}
