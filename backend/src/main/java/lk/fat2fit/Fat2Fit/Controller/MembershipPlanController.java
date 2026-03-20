package lk.fat2fit.Fat2Fit.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lk.fat2fit.Fat2Fit.DTO.Membership.MembershipPlanRequest;
import lk.fat2fit.Fat2Fit.DTO.Membership.MembershipPlanStatusUpdateRequest;
import lk.fat2fit.Fat2Fit.Service.MembershipPlanService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/membership-plans")
@RequiredArgsConstructor
public class MembershipPlanController {

    private final MembershipPlanService membershipPlanService;

    @PostMapping
    public ResponseEntity<?> createPlan(@RequestBody MembershipPlanRequest request) {
        return membershipPlanService.createPlan(request);
    }

    @GetMapping
    public ResponseEntity<?> getAllPlans() {
        return membershipPlanService.getAllPlans();
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActivePlans() {
        return membershipPlanService.getActivePlans();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePlan(@PathVariable Integer id, @RequestBody MembershipPlanRequest request) {
        return membershipPlanService.updatePlan(id, request);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updatePlanStatus(@PathVariable Integer id,
            @RequestBody MembershipPlanStatusUpdateRequest request) {
        return membershipPlanService.updateStatus(id, request);
    }
}
