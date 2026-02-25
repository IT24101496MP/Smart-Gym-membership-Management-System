package lk.fat2fit.Fat2Fit.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lk.fat2fit.Fat2Fit.DTO.Instructor.InstructorRegister;
import lk.fat2fit.Fat2Fit.Service.InstructorService;
import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api/instructor")
@AllArgsConstructor
public class InstructorController {

    private final InstructorService instructorService;

    @PostMapping("/register")
    public ResponseEntity<?> registerInstructor(@RequestBody InstructorRegister instructor){
        return instructorService.registerInstructor(instructor);
    }
}
