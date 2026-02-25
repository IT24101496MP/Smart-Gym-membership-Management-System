package lk.fat2fit.Fat2Fit.Service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
