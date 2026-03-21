package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.DTO.Membership.MembershipRenewalRequest;
import lk.fat2fit.Fat2Fit.DTO.Membership.MembershipHistoryResponse;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.ClientMembership;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import lk.fat2fit.Fat2Fit.Repository.ClientMembershipRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClientMembershipService {

    private final ClientMembershipRepository clientMembershipRepository;
    private final ClientRepository clientRepository;
    private final MembershipPlanRepository membershipPlanRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public ResponseEntity<?> renewMembership(MembershipRenewalRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body("Request payload is required.");
        }

        if (request.getClientId() == null) {
            return ResponseEntity.badRequest().body("Client id is required.");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication is required.");
        }

        boolean isAdmin = hasRole(authentication, "ADMIN");
        boolean isClient = hasRole(authentication, "CLIENT");

        Optional<User> actorOpt = userRepository.findByEmail(authentication.getName());
        if (actorOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authenticated user not found.");
        }

        User actor = actorOpt.get();
        if (isClient && actor.getId() != request.getClientId().intValue()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Clients can only renew memberships for their own profile.");
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

        LocalDate newStartDate = effectiveRenewalDate;
        LocalDate newExpiryDate = newStartDate.plusDays(plan.getDurationDays().longValue());

        boolean overlapExists = hasOverlap(client, newStartDate, newExpiryDate);
        boolean overrideRequested = Boolean.TRUE.equals(request.getOverrideOverlap());

        if (overlapExists && !(isAdmin && overrideRequested)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "message", "Membership period overlaps with an existing active membership.",
                "overlapDetected", true,
                "overrideAllowed", isAdmin));
        }

        if (overlapExists && isAdmin && overrideRequested) {
            auditLogService.logChange(
                client.getId(),
                "CLIENT_MEMBERSHIP",
                Long.valueOf(actor.getId()),
                "MEMBERSHIP_OVERLAP_OVERRIDE",
                current.getStartDate() + " to " + current.getExpiryDate(),
                "Admin " + actor.getEmail() + " overrode overlap for clientId=" + client.getId()
                    + ", clientEmail=" + client.getEmail()
                    + ", newPeriod=" + newStartDate + " to " + newExpiryDate);
        }

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

        return ResponseEntity.ok(Map.of(
            "message", "Membership renewed successfully.",
            "overlapOverridden", overlapExists && isAdmin && overrideRequested,
            "startDate", newStartDate,
            "expiryDate", newExpiryDate,
            "planName", plan.getPlanName()));
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

    private boolean hasRole(Authentication authentication, String role) {
        String expected = "ROLE_" + role;
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(expected::equals);
    }

    private boolean hasOverlap(Client client, LocalDate proposedStartDate, LocalDate proposedEndDate) {
        if (client.getMembershipPlan() == null || client.getMembershipStartDate() == null || client.getMembershipEndDate() == null) {
            return false;
        }

        if (Boolean.TRUE.equals(client.getMembershipSuspended())) {
            return false;
        }

        LocalDate existingStartDate = client.getMembershipStartDate();
        LocalDate existingEndDate = client.getMembershipEndDate();
        return proposedStartDate.isBefore(existingEndDate) && proposedEndDate.isAfter(existingStartDate);
    }
}