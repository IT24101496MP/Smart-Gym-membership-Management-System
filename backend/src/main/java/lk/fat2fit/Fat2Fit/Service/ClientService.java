package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.DTO.ClientRegister;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final AuditLogService auditLogService;
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

        Client saved = clientRepository.save(clientRegisterToClient(clientRegister));
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(saved);
    }

    public Client getClientById(int id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));
    }

    public Client updateClientProfile(int id, ClientRegister dto, Long updatedBy) {
        Client existing = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        compareAndLog(existing.getFirstName(), dto.getFirstName(), "firstName", existing.getClientId(), updatedBy);
        if (!Objects.equals(existing.getFirstName(), dto.getFirstName())) existing.setFirstName(dto.getFirstName());

        compareAndLog(existing.getLastName(), dto.getLastName(), "lastName", existing.getClientId(), updatedBy);
        if (!Objects.equals(existing.getLastName(), dto.getLastName())) existing.setLastName(dto.getLastName());

        compareAndLog(String.valueOf(existing.getAge()), String.valueOf(dto.getAge()), "age", existing.getClientId(), updatedBy);
        if (existing.getAge() != dto.getAge()) existing.setAge(dto.getAge());

        compareAndLog(existing.getGender(), dto.getGender(), "gender", existing.getClientId(), updatedBy);
        if (!Objects.equals(existing.getGender(), dto.getGender())) existing.setGender(dto.getGender());

        compareAndLog(existing.getMobileNumber(), dto.getMobileNumber(), "mobileNumber", existing.getClientId(), updatedBy);
        if (!Objects.equals(existing.getMobileNumber(), dto.getMobileNumber())) existing.setMobileNumber(dto.getMobileNumber());

        compareAndLog(existing.getAddress(), dto.getAddress(), "address", existing.getClientId(), updatedBy);
        if (!Objects.equals(existing.getAddress(), dto.getAddress())) existing.setAddress(dto.getAddress());

        compareAndLog(existing.getLandPhone(), dto.getLandPhone(), "landPhone", existing.getClientId(), updatedBy);
        if (!Objects.equals(existing.getLandPhone(), dto.getLandPhone())) existing.setLandPhone(dto.getLandPhone());

        compareAndLog(existing.getEmergencyContactName(), dto.getEmergencyContactName(), "emergencyContactName", existing.getClientId(), updatedBy);
        if (!Objects.equals(existing.getEmergencyContactName(), dto.getEmergencyContactName()))
            existing.setEmergencyContactName(dto.getEmergencyContactName());

        compareAndLog(existing.getEmergencyContactRelationship(), dto.getEmergencyContactRelationship(), "emergencyContactRelationship", existing.getClientId(), updatedBy);
        if (!Objects.equals(existing.getEmergencyContactRelationship(), dto.getEmergencyContactRelationship()))
            existing.setEmergencyContactRelationship(dto.getEmergencyContactRelationship());

        compareAndLog(existing.getEmergencyContactNumber(), dto.getEmergencyContactNumber(), "emergencyContactNumber", existing.getClientId(), updatedBy);
        if (!Objects.equals(existing.getEmergencyContactNumber(), dto.getEmergencyContactNumber()))
            existing.setEmergencyContactNumber(dto.getEmergencyContactNumber());

        compareAndLog(existing.getBloodGroup(), dto.getBloodGroup(), "bloodGroup", existing.getClientId(), updatedBy);
        if (!Objects.equals(existing.getBloodGroup(), dto.getBloodGroup())) existing.setBloodGroup(dto.getBloodGroup());

        if (dto.getProfilePicture() != null) {
            compareAndLog(
                    existing.getProfilePicture() != null ? new String(existing.getProfilePicture()) : null,
                    new String(dto.getProfilePicture()),
                    "profilePicture",
                    existing.getClientId(),
                    updatedBy
            );
            existing.setProfilePicture(dto.getProfilePicture());
        }

        if (dto.getDigitalSignature() != null) {
            compareAndLog(
                    existing.getDigitalSignature() != null ? new String(existing.getDigitalSignature()) : null,
                    new String(dto.getDigitalSignature()),
                    "digitalSignature",
                    existing.getClientId(),
                    updatedBy
            );
            existing.setDigitalSignature(dto.getDigitalSignature());
        }

        existing.setUpdatedAt(LocalDateTime.now());
        return clientRepository.save(existing);
    }

    private void compareAndLog(String oldValue, String newValue, String field, int profileId, Long updatedBy) {
        if (!Objects.equals(oldValue, newValue)) {
            auditLogService.logChange(profileId, "CLIENT", updatedBy, field, oldValue, newValue);
        }
    }
}