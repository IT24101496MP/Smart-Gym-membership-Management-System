package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.DTO.Instructor.InstructorRegister;
import lk.fat2fit.Fat2Fit.Entity.Instructor;
import lk.fat2fit.Fat2Fit.Repository.InstructorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

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
}
