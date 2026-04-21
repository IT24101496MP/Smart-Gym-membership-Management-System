package lk.fat2fit.Fat2Fit.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lk.fat2fit.Fat2Fit.DTO.Manage.WorkoutScheduleRequest;
import lk.fat2fit.Fat2Fit.Service.WorkoutScheduleService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/manage")
@RequiredArgsConstructor
public class WorkoutScheduleController {

    private final WorkoutScheduleService workoutScheduleService;

    @GetMapping("/clients/{id}/workout-schedule")
    public ResponseEntity<?> getClientWorkoutSchedule(@PathVariable Long id) {
        return workoutScheduleService.getClientWorkoutSchedule(id);
    }

    @GetMapping("/me/workout-schedule")
    public ResponseEntity<?> getMyWorkoutSchedule() {
        return workoutScheduleService.getMyWorkoutSchedule();
    }

    @PostMapping("/clients/{id}/workout-schedule")
    public ResponseEntity<?> createWorkoutSchedule(@PathVariable Long id,
                                                   @RequestBody WorkoutScheduleRequest req) {
        try {
            return workoutScheduleService.createClientWorkoutSchedule(id, req);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Workout schedule saving failed. Please try again.");
        }
    }

    @PutMapping("/clients/{id}/workout-schedule")
    public ResponseEntity<?> updateWorkoutSchedule(@PathVariable Long id,
                                                   @RequestBody WorkoutScheduleRequest req) {
        try {
            return workoutScheduleService.updateClientWorkoutSchedule(id, req);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Schedule update failed. Please try again.");
        }
    }
}
