package lk.fat2fit.Fat2Fit.Controller;

import lk.fat2fit.Fat2Fit.Entity.Instructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lk.fat2fit.Fat2Fit.DTO.Instructor.InstructorRegister;
import lk.fat2fit.Fat2Fit.Service.InstructorService;
import lombok.AllArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/instructor")
@AllArgsConstructor
public class InstructorController {

    private final InstructorService instructorService;

    @PostMapping("/register")
    public ResponseEntity<?> registerInstructor(@RequestBody InstructorRegister instructor){
        return instructorService.registerInstructor(instructor);
    }

    @GetMapping
    public List<Instructor> getAllInstructors(){
        return instructorService.getAllInstructors();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInstructorById(@PathVariable int id){
        return instructorService.getInstructorById(id);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateInstructorStatus(@PathVariable int id, @RequestParam String status){
        return instructorService.updateInstructorStatus(id, status);
    }
}
