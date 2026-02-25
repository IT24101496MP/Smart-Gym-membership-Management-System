package lk.fat2fit.Fat2Fit.Service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

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
}
