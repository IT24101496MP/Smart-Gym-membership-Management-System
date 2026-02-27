package lk.fat2fit.Fat2Fit.Service;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lk.fat2fit.Fat2Fit.Config.JwtUtil;
import lk.fat2fit.Fat2Fit.DTO.Auth.LoginRequest;
import lk.fat2fit.Fat2Fit.DTO.Auth.LoginResponse;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.Instructor;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.InstructorRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final InstructorRepository instructorRepository;
    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public ResponseEntity<?> login(LoginRequest request) {
        String identifier = request.getIdentifier().trim();

        Optional<Instructor> foundInstructor = instructorRepository.findByEmail(identifier);
        if (foundInstructor.isEmpty()) {
            foundInstructor = instructorRepository.findByPhoneNumber(identifier);
        }

        if (foundInstructor.isPresent()) {
            Instructor instructor = foundInstructor.get();

            if (!passwordEncoder.matches(request.getPassword(), instructor.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid username or password.");
            }

            if (instructor.getStatus() == Instructor.ProfileStatus.PENDING) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Your account is pending approval. Please wait for administrator approval.");
            }
            if (instructor.getStatus() == Instructor.ProfileStatus.REJECTED) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Your account application has been rejected. Contact administrator.");
            }
            if (Boolean.FALSE.equals(instructor.getIsActive())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Account is inactive. Contact administrator.");
            }

            return ResponseEntity.ok(new LoginResponse(
                    jwtUtil.generateToken(instructor.getId(), instructor.getEmail(), "INSTRUCTOR")
            ));
        }

        Optional<Client> foundClient = clientRepository.findByEmail(identifier);
        if (foundClient.isEmpty()) {
            foundClient = clientRepository.findByMobileNumber(identifier);
        }

        if (foundClient.isPresent()) {
            Client client = foundClient.get();

            if (!passwordEncoder.matches(request.getPassword(), client.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid username or password.");
            }

            if (Boolean.FALSE.equals(client.getIsActive())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Account is inactive. Contact administrator.");
            }

            return ResponseEntity.ok(new LoginResponse(
                    jwtUtil.generateToken(client.getClientId(), client.getEmail(), "CLIENT")
            ));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Invalid username or password.");
    }

    public ResponseEntity<?> getMe(String token) {
        if (!jwtUtil.isTokenValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token.");
        }

        String role  = jwtUtil.getRoleFromToken(token);
        int    userId = jwtUtil.getUserIdFromToken(token);

        if ("INSTRUCTOR".equals(role)) {
            return instructorRepository.findById(userId)
                    .<ResponseEntity<?>>map(i -> ResponseEntity.ok(
                            new lk.fat2fit.Fat2Fit.DTO.Auth.MeResponse(
                                    i.getId(), i.getFirstName(), i.getLastName(),
                                    i.getEmail(), "INSTRUCTOR")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found."));
        }

        if ("CLIENT".equals(role)) {
            return clientRepository.findById(userId)
                    .<ResponseEntity<?>>map(c -> ResponseEntity.ok(
                            new lk.fat2fit.Fat2Fit.DTO.Auth.MeResponse(
                                    c.getClientId(), c.getFirstName(), c.getLastName(),
                                    c.getEmail(), "CLIENT")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found."));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Unknown role.");
    }
}
