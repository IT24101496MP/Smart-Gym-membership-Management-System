package lk.fat2fit.Fat2Fit.Service;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lk.fat2fit.Fat2Fit.DTO.ClientRegister;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.Role;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final MembershipPlanRepository membershipPlanRepository;
    private final PasswordEncoder passwordEncoder;

    private Client clientRegisterToClient(ClientRegister dto, MembershipPlan membershipPlan) {
        return Client.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .age(dto.getAge())
                .dateOfBirth(dto.getDateOfBirth())
                .gender(dto.getGender())
                .phoneNumber(dto.getPhoneNumber())
                .landPhone(emptyToNull(dto.getLandPhone()))
                .email(dto.getEmail())
                .address(dto.getAddress())
                .password(dto.getPassword() != null ? passwordEncoder.encode(dto.getPassword()) : null)
                .emergencyContactName(emptyToNull(dto.getEmergencyContactName()))
                .emergencyContactRelationship(emptyToNull(dto.getEmergencyContactRelationship()))
                .emergencyContactNumber(emptyToNull(dto.getEmergencyContactNumber()))
                .bloodGroup(emptyToNull(dto.getBloodGroup()))
                .profilePicture(dto.getProfilePicture())
                .digitalSignature(dto.getDigitalSignature())
                .membershipPlan(membershipPlan)
                .role(Role.CLIENT)
                .build();
    }

    private String emptyToNull(String value) {
        return (value == null || value.trim().isEmpty()) ? null : value;
    }

    public ResponseEntity<?> registerClient(ClientRegister dto) {
        if (userRepository.existsByEmailOrPhoneNumber(dto.getEmail(), dto.getPhoneNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Client with email or phone already exists");
        }

        MembershipPlan selectedPlan = null;
        if (dto.getMembershipPlanId() != null) {
            selectedPlan = membershipPlanRepository.findById(dto.getMembershipPlanId()).orElse(null);
            if (selectedPlan == null) {
                return ResponseEntity.badRequest().body("Selected membership plan does not exist.");
            }
            if (selectedPlan.getStatus() != MembershipPlanStatus.ACTIVE) {
                return ResponseEntity.badRequest().body("Inactive membership plans cannot be assigned to new members.");
            }
        }

        clientRepository.save(clientRegisterToClient(dto, selectedPlan));
        return ResponseEntity.status(HttpStatus.CREATED).body("Client registered successfully");
    }
}