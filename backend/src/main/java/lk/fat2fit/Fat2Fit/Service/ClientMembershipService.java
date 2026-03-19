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
        Optional<Client> clientOpt = clientRepository.findById(request.getClientId());
        if (clientOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Client not found.");
        }

        Client client = clientOpt.get();
        Optional<ClientMembership> currentOpt = clientMembershipRepository.findByClientIdAndStatusIn(
                request.getClientId(), List.of(MembershipPlanStatus.ACTIVE, MembershipPlanStatus.EXPIRED)).stream()
                .findFirst();

        if (currentOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("No active or expired membership found for renewal.");
        }

        ClientMembership current = currentOpt.get();
        LocalDate newStartDate = current.getStatus() == MembershipPlanStatus.ACTIVE
                ? current.getExpiryDate()
                : LocalDate.now();
        LocalDate newExpiryDate = newStartDate.plusMonths(request.getDurationMonths());

        if (current.getStatus() == MembershipPlanStatus.ACTIVE) {
            current.setStatus(MembershipPlanStatus.COMPLETED);
            clientMembershipRepository.save(current);
        }

        // Assume the plan is selected by name, but for simplicity, use the current plan
        // or create new.
        // For now, create with the plan name, but since it's a template, perhaps find
        // by name.
        // But to simplify, since the request has planName, but no plan id, perhaps
        // assume it's a new plan or find existing.
        // For the feature, the staff selects a plan, so perhaps the request should have
        // planId.

        // Let's assume the request has planId instead of planName.

        // Wait, in the frontend, I have planName, but to make it work, let's change to
        // planId.

        // But for now, to match, let's find the plan by name.

        Optional<MembershipPlan> planOpt = membershipPlanRepository.findAll().stream()
                .filter(p -> p.getPlanName().equals(request.getPlanName()))
                .findFirst();

        if (planOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Membership plan not found.");
        }

        MembershipPlan plan = planOpt.get();

        ClientMembership newMembership = new ClientMembership();
        newMembership.setClient(client);
        newMembership.setMembershipPlan(plan);
        newMembership.setStartDate(newStartDate);
        newMembership.setExpiryDate(newExpiryDate);
        newMembership.setStatus(MembershipPlanStatus.ACTIVE);

        ClientMembership saved = clientMembershipRepository.save(newMembership);

        client.setCurrentMembership(saved);
        clientRepository.save(client);

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