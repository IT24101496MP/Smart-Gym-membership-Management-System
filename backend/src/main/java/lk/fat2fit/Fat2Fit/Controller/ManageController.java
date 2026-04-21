package lk.fat2fit.Fat2Fit.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lk.fat2fit.Fat2Fit.DTO.Manage.ClientMembershipRenewRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.ClientMembershipSuspendRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.ClientMetricsRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.AssignFitnessGoalRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.HealthScreeningRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.UpdateMyFitnessGoalRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.UserEditRequest;
import lk.fat2fit.Fat2Fit.Service.ManageService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/manage")
@RequiredArgsConstructor
public class ManageController {

    private final ManageService manageService;

    /**
     * GET /api/manage/users
     * Admin: returns all registered users except the caller.
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return manageService.getAllUsersExceptSelf();
    }

    /**
     * GET /api/manage/clients
     * Admin or Instructor: returns all clients.
     */
    @GetMapping("/clients")
    public ResponseEntity<?> getAllClients() {
        return manageService.getAllClients();
    }

    /**
     * GET /api/manage/me
     * Any authenticated user: returns own full details.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getSelf() {
        return manageService.getSelf();
    }

    /**
     * PUT /api/manage/users/{id}
     * Admin: edit any user's details (role is excluded from changes).
     */
    @PutMapping("/users/{id}")
    public ResponseEntity<?> editUser(@PathVariable int id,
            @RequestBody UserEditRequest req) {
        return manageService.editUser(id, req);
    }

    /**
     * PUT /api/manage/clients/{id}
     * Admin ONLY: edit a client's personal details.
     */
    @PutMapping("/clients/{id}")
    public ResponseEntity<?> editClient(@PathVariable Long id,
            @RequestBody UserEditRequest req) {
        return manageService.editClient(id, req);
    }

    /**
     * GET /api/manage/clients/{id}/metrics
     * Admin or Instructor: view a client's body metrics & fitness goals.
     */
    @GetMapping("/clients/{id}/metrics")
    public ResponseEntity<?> getClientMetrics(@PathVariable Long id) {
        return manageService.getClientMetrics(id);
    }

    /**
     * GET /api/manage/clients/{id}/metrics/history
     * Admin or Instructor: view historical body measurements for a client.
     */
    @GetMapping("/clients/{id}/metrics/history")
    public ResponseEntity<?> getClientMetricsHistory(@PathVariable Long id) {
        return manageService.getClientMetricsHistory(id);
    }

    /**
     * GET /api/manage/me/metrics/history
     * Client: view own historical body measurements.
     */
    @GetMapping("/me/metrics/history")
    public ResponseEntity<?> getMyMetricsHistory() {
        return manageService.getMyMetricsHistory();
    }

    /**
     * POST /api/manage/clients/{id}/metrics
     * PUT  /api/manage/clients/{id}/metrics
     * Admin or Instructor: record a body measurement entry.
     */
    @PostMapping("/clients/{id}/metrics")
    @PutMapping("/clients/{id}/metrics")
    public ResponseEntity<?> saveClientMetrics(@PathVariable Long id,
            @RequestBody ClientMetricsRequest req) {
        try {
            return manageService.saveClientMetrics(id, req);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Measurement saving failed. Please try again.");
        }
    }

    /**
     * GET /api/manage/clients/{id}/fitness-goals
     * Admin or Instructor: view assigned fitness goals for a client.
     */
    @GetMapping("/clients/{id}/fitness-goals")
    public ResponseEntity<?> getClientFitnessGoals(@PathVariable Long id) {
        return manageService.getClientFitnessGoals(id);
    }

    /**
     * POST /api/manage/clients/{id}/fitness-goals
     * Instructor: create and assign a fitness goal to a client.
     */
    @PostMapping("/clients/{id}/fitness-goals")
    public ResponseEntity<?> assignClientFitnessGoal(@PathVariable Long id,
            @RequestBody AssignFitnessGoalRequest req) {
        return manageService.assignClientFitnessGoal(id, req);
    }

    /**
     * PUT /api/manage/clients/{id}/fitness-goals/{goalId}
     * Instructor: edit an already assigned fitness goal for a client.
     */
    @PutMapping("/clients/{id}/fitness-goals/{goalId}")
    public ResponseEntity<?> updateClientFitnessGoal(@PathVariable Long id,
            @PathVariable Long goalId,
            @RequestBody AssignFitnessGoalRequest req) {
        return manageService.updateClientFitnessGoal(id, goalId, req);
    }

    /**
     * GET /api/manage/me/fitness-goals
     * Client: view own instructor-assigned fitness goals.
     */
    @GetMapping("/me/fitness-goals")
    public ResponseEntity<?> getMyFitnessGoals() {
        return manageService.getMyFitnessGoals();
    }

    /**
     * PUT /api/manage/me/fitness-goals/{goalId}
     * Client: update own assigned goal status and progress.
     */
    @PutMapping("/me/fitness-goals/{goalId}")
    public ResponseEntity<?> updateMyFitnessGoal(@PathVariable Long goalId,
            @RequestBody UpdateMyFitnessGoalRequest req) {
        return manageService.updateMyFitnessGoal(goalId, req);
    }

    /**
     * POST /api/manage/clients/{id}/health-screening
     * Admin or Instructor: record a client's health readiness questionnaire.
     */
    @PostMapping("/clients/{id}/health-screening")
    public ResponseEntity<?> saveClientHealthScreening(@PathVariable Long id,
            @RequestBody HealthScreeningRequest req) {
        try {
            return manageService.saveClientHealthScreening(id, req);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Health screening submission failed.");
        }
    }

    /**
     * GET /api/manage/clients/{id}/health-screening/latest
     * Admin or Instructor: fetch the latest saved health screening for a client.
     */
    @GetMapping("/clients/{id}/health-screening/latest")
    public ResponseEntity<?> getLatestClientHealthScreening(@PathVariable Long id) {
        return manageService.getLatestClientHealthScreening(id);
    }

    /**
     * PUT /api/manage/clients/{id}/membership/suspension
     * Admin or Instructor: suspend/unsuspend a client's membership.
     */
    @PutMapping("/clients/{id}/membership/suspension")
    public ResponseEntity<?> updateClientMembershipSuspension(@PathVariable int id,
                                                              @RequestBody ClientMembershipSuspendRequest req) {
        return manageService.updateClientMembershipSuspension(id, req);
    }

    /**
     * PUT /api/manage/clients/{id}/membership/renew
     * Admin or Instructor: renew a client's membership period from a start date.
     */
    @PutMapping("/clients/{id}/membership/renew")
    public ResponseEntity<?> renewClientMembership(@PathVariable int id,
                                                   @RequestBody(required = false) ClientMembershipRenewRequest req) {
        return manageService.renewClientMembership(id, req);
    }

    /**
     * PUT /api/manage/me
     * Any authenticated user: edit own personal details (isActive excluded for
     * CLIENT).
     */
    @PutMapping("/me")
    public ResponseEntity<?> editSelf(@RequestBody UserEditRequest req) {
        return manageService.editSelf(req);
    }
}
