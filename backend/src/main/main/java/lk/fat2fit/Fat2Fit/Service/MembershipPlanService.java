package lk.fat2fit.Fat2Fit.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import lk.fat2fit.Fat2Fit.DTO.Membership.MembershipPlanRequest;
import lk.fat2fit.Fat2Fit.DTO.Membership.MembershipPlanResponse;
import lk.fat2fit.Fat2Fit.DTO.Membership.MembershipPlanStatusUpdateRequest;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MembershipPlanService {

    private final MembershipPlanRepository membershipPlanRepository;

    public ResponseEntity<?> createPlan(MembershipPlanRequest request) {
        String validationError = validateRequest(request);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(validationError);
        }

        MembershipPlan plan = MembershipPlan.builder()
                .planName(request.getPlanName().trim())
                .description(emptyToNull(request.getDescription()))
            .durationDays(request.getDurationDays())
                .monthlyPrice(scaleMoney(request.getMonthlyPrice()))
                .admissionFee(scaleMoney(request.getAdmissionFee()))
                .maximumMembers(request.getMaximumMembers())
                .status(MembershipPlanStatus.ACTIVE)
                .build();

        MembershipPlan saved = membershipPlanRepository.save(plan);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    public ResponseEntity<?> getAllPlans() {
        List<MembershipPlanResponse> plans = membershipPlanRepository.findAllByOrderByIdDesc()
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(plans);
    }

    public ResponseEntity<?> getActivePlans() {
        List<MembershipPlanResponse> plans = membershipPlanRepository
                .findByStatusOrderByIdDesc(MembershipPlanStatus.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(plans);
    }

    public ResponseEntity<?> updatePlan(Integer planId, MembershipPlanRequest request) {
        Optional<MembershipPlan> existingOpt = membershipPlanRepository.findById(planId);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Membership plan not found.");
        }

        String validationError = validateRequest(request);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(validationError);
        }

        MembershipPlan plan = existingOpt.get();
        plan.setPlanName(request.getPlanName().trim());
        plan.setDescription(emptyToNull(request.getDescription()));
        plan.setDurationDays(request.getDurationDays());
        plan.setMonthlyPrice(scaleMoney(request.getMonthlyPrice()));
        plan.setAdmissionFee(scaleMoney(request.getAdmissionFee()));
        plan.setMaximumMembers(request.getMaximumMembers());
        if (request.getStatus() != null) {
            plan.setStatus(request.getStatus());
        }

        MembershipPlan updated = membershipPlanRepository.save(plan);
        return ResponseEntity.ok(toResponse(updated));
    }

    public ResponseEntity<?> updateStatus(Integer planId, MembershipPlanStatusUpdateRequest request) {
        if (request == null || request.getStatus() == null) {
            return ResponseEntity.badRequest().body("Plan status is required.");
        }

        Optional<MembershipPlan> existingOpt = membershipPlanRepository.findById(planId);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Membership plan not found.");
        }

        MembershipPlan plan = existingOpt.get();
        plan.setStatus(request.getStatus());

        MembershipPlan updated = membershipPlanRepository.save(plan);
        return ResponseEntity.ok(toResponse(updated));
    }

    private MembershipPlanResponse toResponse(MembershipPlan plan) {
        return MembershipPlanResponse.builder()
                .id(plan.getId())
                .planName(plan.getPlanName())
                .description(plan.getDescription())
            .durationDays(plan.getDurationDays())
                .monthlyPrice(plan.getMonthlyPrice())
                .admissionFee(plan.getAdmissionFee())
                .maximumMembers(plan.getMaximumMembers())
                .status(plan.getStatus())
                .build();
    }

    private String validateRequest(MembershipPlanRequest request) {
        if (request == null) {
            return "Request payload is required.";
        }
        if (request.getPlanName() == null || request.getPlanName().trim().isEmpty()) {
            return "Plan name is required.";
        }
        if (request.getDurationDays() == null) {
            return "Duration is required.";
        }
        if (request.getDurationDays() <= 0) {
            return "Duration must be a positive number of days.";
        }
        if (request.getMonthlyPrice() == null) {
            return "Monthly price is required.";
        }
        if (request.getMonthlyPrice().compareTo(BigDecimal.ZERO) < 0) {
            return "Monthly price cannot be negative.";
        }
        if (request.getAdmissionFee() == null) {
            return "Admission fee is required.";
        }
        if (request.getAdmissionFee().compareTo(BigDecimal.ZERO) < 0) {
            return "Admission fee cannot be negative.";
        }
        if (request.getMaximumMembers() == null) {
            return "Maximum members is required.";
        }
        if (request.getMaximumMembers() < 0) {
            return "Maximum members cannot be negative.";
        }
        return null;
    }

    private BigDecimal scaleMoney(BigDecimal amount) {
        return amount.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private String emptyToNull(String value) {
        return (value == null || value.trim().isEmpty()) ? null : value.trim();
    }
}
