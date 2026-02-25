package lk.fat2fit.Fat2Fit.Controller;

import lk.fat2fit.Fat2Fit.DTO.ClientRegister;
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
            @RequestParam String email,
            @RequestParam String address,
            @RequestParam(required = false) String landPhone,
            @RequestParam(required = false) String emergencyContactName,
            @RequestParam(required = false) String emergencyContactRelationship,
            @RequestParam(required = false) String emergencyContactNumber,
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) MultipartFile profilePicture,
            @RequestParam(required = false) MultipartFile digitalSignature
    ) throws IOException {

        // Convert MultipartFile to byte[] (only when file is present and not empty)
        byte[] profileBytes = (profilePicture != null && !profilePicture.isEmpty()) ? profilePicture.getBytes() : null;
        byte[] signatureBytes = (digitalSignature != null && !digitalSignature.isEmpty()) ? digitalSignature.getBytes() : null;

        // Build ClientRegister DTO
        ClientRegister clientRegister = ClientRegister.builder()
                .firstName(firstName)
                .lastName(lastName)
                .age(age)
                .gender(gender)
                .mobileNumber(mobileNumber)
                .email(email)
                .address(address)
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
}