package lk.fat2fit.Fat2Fit.Service;

import java.util.List;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lk.fat2fit.Fat2Fit.DTO.Instructor.InstructorEmploymentAssignment;
import lk.fat2fit.Fat2Fit.DTO.Instructor.InstructorRegister;
import lk.fat2fit.Fat2Fit.Entity.Instructor;
import lk.fat2fit.Fat2Fit.Repository.InstructorRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InstructorService {

    private final InstructorRepository instructorRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    private Instructor instructorRegisterToInstructor(InstructorRegister instructorRegister){
        return Instructor.builder()
                .firstName(instructorRegister.getFirstName())
                .lastName(instructorRegister.getLastName())
                .phoneNumber(instructorRegister.getPhoneNumber())
                .email(instructorRegister.getEmail())
                .address(instructorRegister.getAddress())
                .qualification(emptyToNull(instructorRegister.getQualification()))
                .yearsOfExperience(instructorRegister.getYearsOfExperience() != null ?
                        instructorRegister.getYearsOfExperience() : 0)
                .areasOfSpecialization(emptyToNull(instructorRegister.getAreasOfSpecialization()))
                .password(passwordEncoder.encode(instructorRegister.getPassword()))
                .build();
    }

    private String emptyToNull(String value) {
        return (value == null || value.trim().isEmpty()) ? null : value;
    }

    public ResponseEntity<?> registerInstructor(InstructorRegister instructor){
        if(instructorRepository.existsByEmailOrPhoneNumber(instructor.getEmail(), instructor.getPhoneNumber())){
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Instructor with same email or phone number already exists");
        }
        instructorRepository.save(instructorRegisterToInstructor(instructor));
        return ResponseEntity.ok().build();
    }

    public List<Instructor> getAllInstructors(){
        return instructorRepository.findAll();
    }

    public ResponseEntity<?> getInstructorById(int id){
        return instructorRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Instructor not found"));
    }

    public Instructor updateInstructorProfile(int id, InstructorRegister dto, Long updatedBy) {
        Instructor existing = instructorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));

        compareAndLog(existing.getFirstName(), dto.getFirstName(), "firstName", existing.getId(), updatedBy);
        if (!Objects.equals(existing.getFirstName(), dto.getFirstName())) existing.setFirstName(dto.getFirstName());

        compareAndLog(existing.getLastName(), dto.getLastName(), "lastName", existing.getId(), updatedBy);
        if (!Objects.equals(existing.getLastName(), dto.getLastName())) existing.setLastName(dto.getLastName());

        compareAndLog(existing.getEmail(), dto.getEmail(), "email", existing.getId(), updatedBy);
        if (!Objects.equals(existing.getEmail(), dto.getEmail())) existing.setEmail(dto.getEmail());

        compareAndLog(existing.getPhoneNumber(), dto.getPhoneNumber(), "phoneNumber", existing.getId(), updatedBy);
        if (!Objects.equals(existing.getPhoneNumber(), dto.getPhoneNumber())) existing.setPhoneNumber(dto.getPhoneNumber());

        compareAndLog(existing.getAddress(), dto.getAddress(), "address", existing.getId(), updatedBy);
        if (!Objects.equals(existing.getAddress(), dto.getAddress())) existing.setAddress(dto.getAddress());

        compareAndLog(existing.getQualification(), dto.getQualification(), "qualification", existing.getId(), updatedBy);
        if (!Objects.equals(existing.getQualification(), dto.getQualification())) existing.setQualification(dto.getQualification());

        if (dto.getYearsOfExperience() != null) {
            compareAndLog(String.valueOf(existing.getYearsOfExperience()), String.valueOf(dto.getYearsOfExperience()),
                    "yearsOfExperience", existing.getId(), updatedBy);
            existing.setYearsOfExperience(dto.getYearsOfExperience());
        }

        compareAndLog(existing.getAreasOfSpecialization(), dto.getAreasOfSpecialization(), "areasOfSpecialization", existing.getId(), updatedBy);
        if (!Objects.equals(existing.getAreasOfSpecialization(), dto.getAreasOfSpecialization()))
            existing.setAreasOfSpecialization(dto.getAreasOfSpecialization());

        return instructorRepository.save(existing);
    }

    private void compareAndLog(String oldValue, String newValue, String field, int profileId, Long updatedBy) {
        if (!Objects.equals(oldValue, newValue)) {
            auditLogService.logChange(profileId, "INSTRUCTOR", updatedBy, field, oldValue, newValue);
        }
    }

    public ResponseEntity<?> updateInstructorStatus(int id, String status){
        Instructor.ProfileStatus newStatus;
        try {
            newStatus = Instructor.ProfileStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid status value: " + status);
        }

        return instructorRepository.findById(id).map(instructor -> {
            instructor.setStatus(newStatus);
            instructorRepository.save(instructor);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Instructor not found"));
    }

    public ResponseEntity<?> assignEmploymentDetails(int id, InstructorEmploymentAssignment dto){
        return instructorRepository.findById(id).map(instructor -> {

            if (instructor.getStatus() != Instructor.ProfileStatus.APPROVED) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Employment details can only be assigned to APPROVED instructors");
            }

            if (dto.getEmploymentType() != null) {
                try {
                    instructor.setEmploymentType(
                            Instructor.EmploymentType.valueOf(dto.getEmploymentType().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Invalid employment type: " + dto.getEmploymentType());
                }
            }

            if (dto.getWorkingHoursPerWeek() != null) {
                if (dto.getWorkingHoursPerWeek() < 1 || dto.getWorkingHoursPerWeek() > 168) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Working hours must be between 1 and 168");
                }
                instructor.setWorkingHoursPerWeek(dto.getWorkingHoursPerWeek());
            }

            if (dto.getSalary() != null) {
                if (dto.getSalary().compareTo(java.math.BigDecimal.ZERO) < 0) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Salary cannot be negative");
                }
                instructor.setSalary(dto.getSalary());
            }

            if (dto.getIsActive() != null) {
                instructor.setIsActive(dto.getIsActive());
            }

            instructorRepository.save(instructor);
            return ResponseEntity.<Object>ok(instructor);
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Instructor not found"));
    }
}