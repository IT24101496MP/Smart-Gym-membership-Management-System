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

        Optional<Client> clientOpt = findClientById(request.getClientId());
        if (clientOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Client not found.");
        }

        Client client = clientOpt.get();

        syncClientMembershipStatuses((long) client.getId());

        Optional<ClientMembership> currentOpt = clientMembershipRepository
                .findFirstByClientIdAndStatusInOrderByExpiryDateDescIdDesc(
                        request.getClientId(),
                        List.of(MembershipPlanStatus.ACTIVE, MembershipPlanStatus.EXPIRED));

        if (currentOpt.isEmpty()) {
            currentOpt = createInitialHistoryFromClientProfile(client);
        }

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

        if (current.getStatus() == MembershipPlanStatus.ACTIVE) {
            current.setStatus(MembershipPlanStatus.COMPLETED);
            clientMembershipRepository.save(current);
        }

        ClientMembership newMembership = new ClientMembership();
        newMembership.setClient(client);
        newMembership.setMembershipPlan(plan);
        newMembership.setStartDate(newStartDate);
        newMembership.setExpiryDate(newExpiryDate);
        newMembership.setStatus(MembershipPlanStatus.ACTIVE);

        clientMembershipRepository.save(newMembership);

        client.setMembershipPlan(plan);
        client.setMembershipStartDate(newStartDate);
        client.setMembershipEndDate(newExpiryDate);
        clientRepository.save(client);

        return ResponseEntity.ok("Membership renewed successfully.");
    }

    public List<MembershipHistoryResponse> getMembershipHistory(Long clientId) {
        syncClientMembershipStatuses(clientId);
        List<ClientMembership> memberships = clientMembershipRepository.findByClientIdOrderByIdDesc(clientId);
        List<MembershipHistoryResponse> history = memberships.stream().map(m -> new MembershipHistoryResponse(
                m.getId(),
                m.getMembershipPlan().getPlanName(),
                m.getStartDate(),
                m.getExpiryDate(),
                String.valueOf(m.getStatus()))).collect(Collectors.toList());

        Optional<Client> clientOpt = findClientById(clientId);
        if (clientOpt.isPresent()) {
            Client client = clientOpt.get();
            MembershipPeriod profilePeriod = resolveClientProfilePeriod(client);
            if (client.getMembershipPlan() != null
                    && profilePeriod.startDate() != null
                    && profilePeriod.endDate() != null
                    && !containsMatchingMembership(memberships, client, profilePeriod)) {
                history.add(0, new MembershipHistoryResponse(
                        null,
                        client.getMembershipPlan().getPlanName(),
                        profilePeriod.startDate(),
                        profilePeriod.endDate(),
                        resolveStatus(profilePeriod.startDate(), profilePeriod.endDate()).toString()));
            }
        }

        return history;
    }

    private void syncClientMembershipStatuses(Long clientId) {
        List<ClientMembership> memberships = clientMembershipRepository.findByClientIdOrderByIdDesc(clientId);
        boolean changed = false;
        LocalDate today = LocalDate.now();

        for (ClientMembership membership : memberships) {
            if (membership.getStatus() == MembershipPlanStatus.COMPLETED
                    || membership.getStatus() == MembershipPlanStatus.INACTIVE) {
                continue;
            }

            MembershipPlanStatus expected = today.isAfter(membership.getExpiryDate())
                    ? MembershipPlanStatus.EXPIRED
                    : MembershipPlanStatus.ACTIVE;

            if (membership.getStatus() != expected) {
                membership.setStatus(expected);
                changed = true;
            }
        }

        if (changed) {
            clientMembershipRepository.saveAll(memberships);
        }
    }

    private Optional<ClientMembership> createInitialHistoryFromClientProfile(Client client) {
        MembershipPeriod period = resolveClientProfilePeriod(client);
        if (client.getMembershipPlan() == null
                || period.startDate() == null
                || period.endDate() == null) {
            return Optional.empty();
        }

        ClientMembership seed = new ClientMembership();
        seed.setClient(client);
        seed.setMembershipPlan(client.getMembershipPlan());
        seed.setStartDate(period.startDate());
        seed.setExpiryDate(period.endDate());
        seed.setStatus(resolveStatus(period.startDate(), period.endDate()));
        return Optional.of(clientMembershipRepository.save(seed));
    }

    private MembershipPlanStatus resolveStatus(LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();
        if (today.isAfter(endDate)) {
            return MembershipPlanStatus.EXPIRED;
        }
        if (today.isBefore(startDate)) {
            return MembershipPlanStatus.INACTIVE;
        }
        return MembershipPlanStatus.ACTIVE;
    }

    private boolean containsMatchingMembership(List<ClientMembership> memberships, Client client, MembershipPeriod period) {
        return memberships.stream().anyMatch(m ->
                m.getMembershipPlan() != null
                        && m.getMembershipPlan().getId() != null
                        && client.getMembershipPlan() != null
                        && client.getMembershipPlan().getId() != null
                        && m.getMembershipPlan().getId().equals(client.getMembershipPlan().getId())
                        && period.startDate().equals(m.getStartDate())
                        && period.endDate().equals(m.getExpiryDate()));
    }

    private MembershipPeriod resolveClientProfilePeriod(Client client) {
        LocalDate startDate = client.getMembershipStartDate();
        LocalDate endDate = client.getMembershipEndDate();

        if (startDate != null && endDate != null) {
            return new MembershipPeriod(startDate, endDate);
        }

        if (client.getMembershipPlan() != null
                && client.getMembershipPlan().getDurationDays() != null
                && client.getCreatedAt() != null) {
            LocalDate derivedStart = client.getCreatedAt().toLocalDate();
            LocalDate derivedEnd = derivedStart.plusDays(client.getMembershipPlan().getDurationDays().longValue());
            return new MembershipPeriod(derivedStart, derivedEnd);
        }

        return new MembershipPeriod(null, null);
    }

    private record MembershipPeriod(LocalDate startDate, LocalDate endDate) {
    }

    private Optional<Client> findClientById(Long clientId) {
        if (clientId == null) {
            return Optional.empty();
        }
        if (clientId > Integer.MAX_VALUE || clientId < Integer.MIN_VALUE) {
            return Optional.empty();
        }
        return clientRepository.findById(clientId.intValue());
    }
}