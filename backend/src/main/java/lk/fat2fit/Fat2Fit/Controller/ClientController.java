package lk.fat2fit.Fat2Fit.Controller;

import lk.fat2fit.Fat2Fit.DTO.ClientRegister;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Service.ClientService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/client")
@AllArgsConstructor
public class ClientController {

    private final ClientService clientService;

    private static String emptyToNull(String value) {
        return (value == null || value.trim().isEmpty()) ? null : value;
    }

    @PostMapping(value = "/register", consumes = {"multipart/form-data"})
    public ResponseEntity<?> registerClient(
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
            @RequestParam(required = false) MultipartFile digitalSignature
    ) throws IOException {

        if (firstName == null || firstName.trim().isEmpty()) return ResponseEntity.badRequest().body("First name is required");
        if (lastName == null || lastName.trim().isEmpty()) return ResponseEntity.badRequest().body("Last name is required");
        if (age <= 0) return ResponseEntity.badRequest().body("Invalid age");
        if (!gender.matches("Male|Female|Prefer not to say")) return ResponseEntity.badRequest().body("Invalid gender");
        if (address == null || address.trim().isEmpty()) return ResponseEntity.badRequest().body("Address is required");
        if (!mobileNumber.matches("0\\d{9}")) return ResponseEntity.badRequest().body("Invalid mobile number");
        if (landPhone != null && !landPhone.trim().isEmpty() && !landPhone.matches("0\\d{9}"))
            return ResponseEntity.badRequest().body("Invalid land phone");
        if (emergencyContactNumber != null && !emergencyContactNumber.trim().isEmpty() && !emergencyContactNumber.matches("0\\d{9}"))
            return ResponseEntity.badRequest().body("Invalid emergency contact number");

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

        return clientService.registerClient(clientRegister);
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

        byte[] profileBytes = (profilePicture != null && !profilePicture.isEmpty()) ? profilePicture.getBytes() : null;
        byte[] signatureBytes = (digitalSignature != null && !digitalSignature.isEmpty()) ? digitalSignature.getBytes() : null;

        ClientRegister clientRegister = ClientRegister.builder()
                .firstName(firstName)
                .lastName(lastName)
                .age(age)
                .gender(gender)
                .mobileNumber(mobileNumber)
                .address(address)
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
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}