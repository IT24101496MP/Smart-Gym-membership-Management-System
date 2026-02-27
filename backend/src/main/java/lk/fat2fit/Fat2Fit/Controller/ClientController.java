package lk.fat2fit.Fat2Fit.Controller;

import lk.fat2fit.Fat2Fit.DTO.ClientRegister;
import lk.fat2fit.Fat2Fit.Entity.Enum.Gender;
import lk.fat2fit.Fat2Fit.Service.ClientService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

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

        if (firstName == null || firstName.trim().isEmpty())
            return ResponseEntity.badRequest().body("First name is required");

        if (lastName == null || lastName.trim().isEmpty())
            return ResponseEntity.badRequest().body("Last name is required");

        if (age <= 0)
            return ResponseEntity.badRequest().body("Invalid age");

        Date dob;
        try {
            dob = new SimpleDateFormat("yyyy-MM-dd").parse(dateOfBirth);
        } catch (ParseException e) {
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

        ClientRegister clientRegister = ClientRegister.builder()
                .firstName(firstName.trim())
                .lastName(lastName.trim())
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

        return clientService.registerClient(clientRegister);
    }
}