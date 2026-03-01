package lk.fat2fit.Fat2Fit.Controller;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lk.fat2fit.Fat2Fit.DTO.ClientRegister;
import lk.fat2fit.Fat2Fit.Entity.Enum.Gender;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Service.ClientService;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import lombok.AllArgsConstructor;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/client")
@AllArgsConstructor
public class ClientController {

    private final ClientService clientService;
    private final Logger logger = LoggerFactory.getLogger(ClientController.class);

    private static String emptyToNull(String value) {
        return (value == null || value.trim().isEmpty()) ? null : value;
    }

    @GetMapping()
    public ResponseEntity<List<Client>> getAllClients() {
        return ResponseEntity.ok(clientService.getAllClients());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Client>> getActiveClients() {
        return ResponseEntity.ok(clientService.getActiveClients());
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<String> deactivateClient(
            @PathVariable int id,
            @RequestHeader("Role") String role) {

        if (!"ADMIN".equals(role) && !"INSTRUCTOR".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Unauthorized: Only admin or instructor can deactivate.");
        }

        try {
            clientService.deactivateClient(id);
            return ResponseEntity.ok("Member deactivated successfully");
        } catch (Exception e) {
            logger.error("Error deactivating client", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Deactivation failed");
        }
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<String> activateClient(
            @PathVariable int id,
            @RequestHeader("Role") String role) {

        if (!"ADMIN".equals(role) && !"INSTRUCTOR".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Unauthorized: Only admin or instructor can activate.");
        }

        try {
            clientService.activateClient(id);
            return ResponseEntity.ok("Member activated successfully");
        } catch (Exception e) {
            logger.error("Error activating client", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Activation failed");
        }
    }

    @PostMapping(value = "/register", consumes = {"multipart/form-data"})
    public ResponseEntity<?> registerClient(
            @RequestParam String firstName,
            @RequestParam String lastName,
            @RequestParam int age,
            @RequestParam String dateOfBirth,
            @RequestParam String gender,
            @RequestParam String phoneNumber,
            @RequestParam String email,
            @RequestParam String address,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String landPhone,
            @RequestParam(required = false) String emergencyContactName,
            @RequestParam(required = false) String emergencyContactRelationship,
            @RequestParam(required = false) String emergencyContactNumber,
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) MultipartFile profilePicture,
            @RequestParam(required = false) MultipartFile digitalSignature
    ) throws IOException {
        if (firstName == null || firstName.trim().isEmpty()) return ResponseEntity.badRequest().body("First name is required");
        if (lastName == null || lastName.trim().isEmpty()) return ResponseEntity.badRequest().body("Last name is required");
        LocalDate dob;
        try {
            dob = LocalDate.parse(dateOfBirth);
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Invalid date of birth format. Use yyyy-MM-dd");
        }

        Gender genderEnum;
        try {
            genderEnum = Gender.valueOf(gender.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid gender. Allowed: MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY");
        }
      
        if (!phoneNumber.matches("0\\d{9}"))
            return ResponseEntity.badRequest().body("Invalid phone number");

        if (address == null || address.trim().isEmpty())
            return ResponseEntity.badRequest().body("Address is required");

        if (landPhone != null && !landPhone.trim().isEmpty() && !landPhone.matches("0\\d{9}"))
            return ResponseEntity.badRequest().body("Invalid land phone");

        if (emergencyContactNumber != null && !emergencyContactNumber.trim().isEmpty()
                && !emergencyContactNumber.matches("0\\d{9}"))
            return ResponseEntity.badRequest().body("Invalid emergency contact number");
        
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$"))
            return ResponseEntity.badRequest().body("Invalid email");
        
        byte[] profileBytes = (profilePicture != null && !profilePicture.isEmpty())
                ? profilePicture.getBytes() : null;
        byte[] signatureBytes = (digitalSignature != null && !digitalSignature.isEmpty())
                ? digitalSignature.getBytes() : null;

        byte[] profileBytes = (profilePicture != null && !profilePicture.isEmpty()) ? profilePicture.getBytes() : null;
        byte[] signatureBytes = (digitalSignature != null && !digitalSignature.isEmpty()) ? digitalSignature.getBytes() : null;

        ClientRegister clientRegister = ClientRegister.builder()
                .firstName(firstName.trim())
                .lastName(lastName.trim())
                .age(age)
                .gender(gender)
                .mobileNumber(mobileNumber)
                .address(address.trim())
                .landPhone(emptyToNull(landPhone))
                .emergencyContactName(emptyToNull(emergencyContactName))
                .emergencyContactRelationship(emptyToNull(emergencyContactRelationship))
                .emergencyContactNumber(emptyToNull(emergencyContactNumber))
                .bloodGroup(emptyToNull(bloodGroup))
                .profilePicture(profileBytes)
                .digitalSignature(signatureBytes)
                .build();

        try {
            return clientService.registerClient(clientRegister);
        } catch (Exception e) {
            logger.error("Error registering client", e);
            return ResponseEntity.status(500).body("Server error during registration: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getClientById(@PathVariable int id) {
        try {
            Client client = clientService.getClientById(id);
            return ResponseEntity.ok(client);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<?> getClientByUserId(@PathVariable int id) {
        try {
            Client client = clientService.getClientById(id);
            return ResponseEntity.ok(client);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/update")
    public ResponseEntity<?> updateClientProfile(
            @PathVariable int id,
            @RequestParam String firstName,
            @RequestParam String lastName,
            @RequestParam int age,
            @RequestParam String gender,
            @RequestParam String mobileNumber,
            @RequestParam String address,
            @RequestParam(required = false) String landPhone,
            @RequestParam(required = false) String emergencyContactName,
            @RequestParam(required = false) String emergencyContactRelationship,
            @RequestParam(required = false) String emergencyContactNumber,
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) MultipartFile profilePicture,
            @RequestParam(required = false) MultipartFile digitalSignature,
            @RequestParam Long updatedBy
    ) throws IOException {
        if (updatedBy == null) {
            return ResponseEntity.badRequest().body("updatedBy parameter is required");
        }

        byte[] profileBytes = (profilePicture != null && !profilePicture.isEmpty()) ? profilePicture.getBytes() : null;
        byte[] signatureBytes = (digitalSignature != null && !digitalSignature.isEmpty()) ? digitalSignature.getBytes() : null;

        ClientRegister clientRegister = ClientRegister.builder()
                .firstName(firstName)
                .lastName(lastName)
                .age(age)
                .dateOfBirth(dob)
                .gender(genderEnum)
                .phoneNumber(phoneNumber)
                .email(email)
                .address(address.trim())
                .password(emptyToNull(password))
                .landPhone(emptyToNull(landPhone))
                .emergencyContactName(emptyToNull(emergencyContactName))
                .emergencyContactRelationship(emptyToNull(emergencyContactRelationship))
                .emergencyContactNumber(emptyToNull(emergencyContactNumber))
                .bloodGroup(emptyToNull(bloodGroup))
                .profilePicture(profileBytes)
                .digitalSignature(signatureBytes)
                .build();

        try {
            Client updatedClient = clientService.updateClientProfile(id, clientRegister, updatedBy);
            return ResponseEntity.ok(updatedClient);
        } catch (RuntimeException e) {
            logger.error("Error updating client profile", e);
            // return 500 to differentiate from not-found
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Server error during update: " + e.getMessage());
        }
    }
}