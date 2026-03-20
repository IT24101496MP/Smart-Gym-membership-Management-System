package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.DTO.Membership.MembershipRenewalRequest;
import lk.fat2fit.Fat2Fit.DTO.Membership.MembershipHistoryResponse;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.ClientMembership;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import lk.fat2fit.Fat2Fit.Repository.ClientMembershipRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClientMembershipService {

    private final ClientMembershipRepository clientMembershipRepository;
    private final ClientRepository clientRepository;
    private final MembershipPlanRepository membershipPlanRepository;

    public ResponseEntity<?> renewMembership(MembershipRenewalRequest request) {
        if (request.getClientId() == null) {
            return ResponseEntity.badRequest().body("Client id is required.");
        }

        Optional<Client> clientOpt = clientRepository.findById(request.getClientId());
        if (clientOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Client not found.");
        }

        Optional<ClientMembership> currentOpt = clientMembershipRepository
                .findFirstByClientIdAndStatusInOrderByExpiryDateDescIdDesc(
                        request.getClientId(),
                        List.of(MembershipPlanStatus.ACTIVE, MembershipPlanStatus.EXPIRED));

        if (currentOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("No active or expired membership found for renewal.");
        }

        ClientMembership current = currentOpt.get();
        Optional<MembershipPlan> planOpt;
        if (request.getPlanId() != null) {
            planOpt = membershipPlanRepository.findById(request.getPlanId());
        } else if (request.getPlanName() != null && !request.getPlanName().isBlank()) {
            planOpt = membershipPlanRepository.findAll().stream()
                    .filter(p -> p.getPlanName().equalsIgnoreCase(request.getPlanName().trim()))
                    .findFirst();
        } else {
            return ResponseEntity.badRequest().body("A membership plan is required.");
        }

        if (planOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Membership plan not found.");
        }

        MembershipPlan plan = planOpt.get();
        if (plan.getStatus() != MembershipPlanStatus.ACTIVE) {
            return ResponseEntity.badRequest().body("Selected membership plan must be active.");
        }

        LocalDate effectiveRenewalDate = request.getRenewalDate() != null
                ? request.getRenewalDate()
                : LocalDate.now();

        LocalDate newStartDate = current.getStatus() == MembershipPlanStatus.ACTIVE
                ? current.getExpiryDate()
                : effectiveRenewalDate;
        LocalDate newExpiryDate = newStartDate.plusDays(plan.getDurationDays().longValue());

        ClientMembership newMembership = new ClientMembership();
        newMembership.setClient(clientOpt.get());
        newMembership.setMembershipPlan(plan);
        newMembership.setStartDate(newStartDate);
        newMembership.setExpiryDate(newExpiryDate);
        newMembership.setStatus(MembershipPlanStatus.ACTIVE);

        clientMembershipRepository.save(newMembership);

        return ResponseEntity.ok("Membership renewed successfully.");
    }

    public List<MembershipHistoryResponse> getMembershipHistory(Long clientId) {
        List<ClientMembership> memberships = clientMembershipRepository.findByClientIdOrderByIdDesc(clientId);
        return memberships.stream().map(m -> new MembershipHistoryResponse(
                m.getId(),
                m.getMembershipPlan().getPlanName(),
                m.getStartDate(),
                m.getExpiryDate(),
                m.getStatus().toString())).collect(Collectors.toList());
    }
}