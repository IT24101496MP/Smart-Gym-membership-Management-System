package lk.fat2fit.Fat2Fit.Service;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import lk.fat2fit.Fat2Fit.DTO.Manage.WorkoutScheduleRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.WorkoutScheduleResponse;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.Enum.Role;
import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Entity.WorkoutSchedule;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;
import lk.fat2fit.Fat2Fit.Repository.WorkoutScheduleRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkoutScheduleService {

    private final WorkoutScheduleRepository workoutScheduleRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    public ResponseEntity<?> getClientWorkoutSchedule(Long clientId) {
        if (!clientRepository.existsById(clientId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found.");
        }

        return workoutScheduleRepository.findByClientId(clientId)
                .<ResponseEntity<?>>map(schedule -> ResponseEntity.ok(toResponse(schedule)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No workout schedule assigned for this member."));
    }

    public ResponseEntity<?> getMyWorkoutSchedule() {
        User self = getCurrentUser();
        if (!(self instanceof Client client)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only members can access their assigned workout schedule.");
        }

        return workoutScheduleRepository.findByClientId((long) client.getId())
                .<ResponseEntity<?>>map(schedule -> ResponseEntity.ok(toResponse(schedule)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No workout schedule assigned yet."));
    }

    public ResponseEntity<?> createClientWorkoutSchedule(Long clientId, WorkoutScheduleRequest req) {
        User self = getCurrentUser();
        if (self.getRole() != Role.INSTRUCTOR) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only instructors can assign workout schedules.");
        }

        Optional<Client> clientOpt = clientRepository.findById(clientId);
        if (clientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found.");
        }

        String validationError = validateRequest(req);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(validationError);
        }

        if (workoutScheduleRepository.existsByClientId(clientId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("A workout schedule already exists for this member. Please update it instead.");
        }

        WorkoutSchedule schedule = WorkoutSchedule.builder()
                .client(clientOpt.get())
                .trainingType(req.getTrainingType().trim())
                .fitnessGoal(req.getFitnessGoal().trim())
                .exercises(req.getExercises().trim())
                .durationMinutes(req.getDurationMinutes())
                .frequencyPerWeek(req.getFrequencyPerWeek())
                .specialInstructions(normalizeText(req.getSpecialInstructions()))
                .assignedBy(self)
                .build();

        WorkoutSchedule saved = workoutScheduleRepository.save(schedule);
        return ResponseEntity.ok(toResponse(saved));
    }

    public ResponseEntity<?> updateClientWorkoutSchedule(Long clientId, WorkoutScheduleRequest req) {
        User self = getCurrentUser();
        if (self.getRole() != Role.INSTRUCTOR) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only instructors can update workout schedules.");
        }

        String validationError = validateRequest(req);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(validationError);
        }

        Optional<WorkoutSchedule> existingOpt = workoutScheduleRepository.findByClientId(clientId);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No existing workout schedule found for this member.");
        }

        WorkoutSchedule existing = existingOpt.get();
        existing.setTrainingType(req.getTrainingType().trim());
        existing.setFitnessGoal(req.getFitnessGoal().trim());
        existing.setExercises(req.getExercises().trim());
        existing.setDurationMinutes(req.getDurationMinutes());
        existing.setFrequencyPerWeek(req.getFrequencyPerWeek());
        existing.setSpecialInstructions(normalizeText(req.getSpecialInstructions()));
        existing.setAssignedBy(self);

        WorkoutSchedule saved = workoutScheduleRepository.save(existing);
        return ResponseEntity.ok(toResponse(saved));
    }

    private String validateRequest(WorkoutScheduleRequest req) {
        if (req == null
                || isBlank(req.getTrainingType())
                || isBlank(req.getFitnessGoal())
                || isBlank(req.getExercises())
                || req.getDurationMinutes() == null
                || req.getFrequencyPerWeek() == null) {
            return "All required schedule details must be provided.";
        }

        if (req.getDurationMinutes() <= 0 || req.getDurationMinutes() > 600) {
            return "Duration must be between 1 and 600 minutes.";
        }

        if (req.getFrequencyPerWeek() <= 0 || req.getFrequencyPerWeek() > 14) {
            return "Frequency must be between 1 and 14 sessions per week.";
        }

        if (req.getTrainingType().trim().length() > 120) {
            return "Training type cannot exceed 120 characters.";
        }

        if (req.getFitnessGoal().trim().length() > 120) {
            return "Fitness goal cannot exceed 120 characters.";
        }

        if (req.getExercises().trim().length() > 2000) {
            return "Exercises cannot exceed 2000 characters.";
        }

        if (req.getSpecialInstructions() != null && req.getSpecialInstructions().trim().length() > 2000) {
            return "Special instructions cannot exceed 2000 characters.";
        }

        return null;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private WorkoutScheduleResponse toResponse(WorkoutSchedule schedule) {
        String clientName = schedule.getClient().getFirstName() + " " + schedule.getClient().getLastName();
        return WorkoutScheduleResponse.builder()
                .id(schedule.getId())
                .clientId((long) schedule.getClient().getId())
                .clientName(clientName)
                .trainingType(schedule.getTrainingType())
                .fitnessGoal(schedule.getFitnessGoal())
                .exercises(schedule.getExercises())
                .durationMinutes(schedule.getDurationMinutes())
                .frequencyPerWeek(schedule.getFrequencyPerWeek())
                .specialInstructions(schedule.getSpecialInstructions())
                .assignedByUserId(schedule.getAssignedBy() != null ? schedule.getAssignedBy().getId() : null)
                .assignedByRole(schedule.getAssignedBy() != null && schedule.getAssignedBy().getRole() != null
                        ? schedule.getAssignedBy().getRole().name()
                        : null)
                .createdAt(schedule.getCreatedAt())
                .updatedAt(schedule.getUpdatedAt())
                .build();
    }
}
