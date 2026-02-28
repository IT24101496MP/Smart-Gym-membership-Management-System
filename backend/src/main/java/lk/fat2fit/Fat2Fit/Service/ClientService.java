package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.DTO.ClientRegister;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;

    private Client clientRegisterToClient(ClientRegister clientRegister) {
        return Client.builder()
                .firstName(clientRegister.getFirstName())
                .lastName(clientRegister.getLastName())
                .age(clientRegister.getAge())
                .gender(clientRegister.getGender())
                .mobileNumber(clientRegister.getMobileNumber())
                .landPhone(emptyToNull(clientRegister.getLandPhone()))
                .address(clientRegister.getAddress())
                .emergencyContactName(emptyToNull(clientRegister.getEmergencyContactName()))
                .emergencyContactRelationship(emptyToNull(clientRegister.getEmergencyContactRelationship()))
                .emergencyContactNumber(emptyToNull(clientRegister.getEmergencyContactNumber()))
                .bloodGroup(emptyToNull(clientRegister.getBloodGroup()))
                .profilePicture(clientRegister.getProfilePicture())
                .digitalSignature(clientRegister.getDigitalSignature())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private String emptyToNull(String value) {
        return (value == null || value.trim().isEmpty()) ? null : value;
    }

    public ResponseEntity<?> registerClient(ClientRegister clientRegister) {

        boolean mobileExists = clientRepository.existsByMobileNumber(clientRegister.getMobileNumber());

        if (mobileExists) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("This mobile number already exists.");
        }

        clientRepository.save(clientRegisterToClient(clientRegister));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Client registered successfully");
    }
}