package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.DTO.Payment.CreatePaymentIntentRequest;
import lk.fat2fit.Fat2Fit.DTO.Payment.MockPaymentConfirmRequest;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.ClientMembership;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import lk.fat2fit.Fat2Fit.Repository.ClientMembershipRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final ClientRepository clientRepository;
    private final MembershipPlanRepository membershipPlanRepository;
    private final ClientMembershipRepository clientMembershipRepository;
    private final JavaMailSender javaMailSender;

    public Map<String, Object> createPaymentIntent(CreatePaymentIntentRequest request) {
        if (request.getClientId() == null || request.getPlanId() == null) {
            throw new IllegalArgumentException("clientId and planId are required");
        }

        Optional<Client> clientOpt = clientRepository.findById(request.getClientId());
        if (clientOpt.isEmpty()) {
            throw new IllegalArgumentException("Client not found");
        }

        Optional<MembershipPlan> planOpt = membershipPlanRepository.findById(request.getPlanId());
        if (planOpt.isEmpty()) {
            throw new IllegalArgumentException("Membership plan not found");
        }

        MembershipPlan plan = planOpt.get();
        if (plan.getStatus() != MembershipPlanStatus.ACTIVE) {
            throw new IllegalArgumentException("Membership plan is not active");
        }

        BigDecimal amountBD = plan.getMonthlyPrice();
        if (amountBD == null) {
            throw new IllegalArgumentException("Membership plan price is not set");
        }

        long amountInCents = amountBD.multiply(BigDecimal.valueOf(100)).longValue();
        if (amountInCents <= 0) {
            throw new IllegalArgumentException("Invalid plan amount");
        }

        String paymentReference = "LOCALPAY-" + UUID.randomUUID();

        Map<String, Object> response = new HashMap<>();
        response.put("paymentIntentId", paymentReference);
        response.put("amountInCents", amountInCents);
        response.put("currency", request.getCurrency() == null ? "usd" : request.getCurrency());
        response.put("status", "PENDING_CONFIRMATION");
        return response;
    }

    @Transactional
    public Map<String, Object> confirmMockPayment(MockPaymentConfirmRequest request) {
        if (request.getClientId() == null || request.getPlanId() == null) {
            throw new IllegalArgumentException("clientId and planId are required");
        }

        Optional<Client> clientOpt = clientRepository.findById(request.getClientId());
        if (clientOpt.isEmpty()) {
            throw new IllegalArgumentException("Client not found");
        }

        Optional<MembershipPlan> planOpt = membershipPlanRepository.findById(request.getPlanId());
        if (planOpt.isEmpty()) {
            throw new IllegalArgumentException("Membership plan not found");
        }

        MembershipPlan plan = planOpt.get();
        if (plan.getStatus() != MembershipPlanStatus.ACTIVE) {
            throw new IllegalArgumentException("Membership plan is not active");
        }

        String paymentReference = request.getPaymentReference();
        if (paymentReference == null || paymentReference.isBlank()) {
            paymentReference = "LOCALPAY-" + UUID.randomUUID();
        }

        Client client = clientOpt.get();
        long clientIdLong = client.getId();
        Optional<ClientMembership> existing = clientMembershipRepository
                .findFirstByClientIdAndPaymentIntentId(clientIdLong, paymentReference);

        Map<String, Object> response = new HashMap<>();
        response.put("paymentReference", paymentReference);

        if (existing.isPresent()) {
            response.put("status", "ALREADY_PROCESSED");
            response.put("message", "Payment already confirmed. Membership activation was skipped.");
            return response;
        }

        activateMembership(client, plan, paymentReference);
        response.put("status", "SUCCESS");
        response.put("message", "Payment confirmed and membership activated.");
        return response;
    }

    private void activateMembership(Client client, MembershipPlan plan, String paymentReference) {
        LocalDate startDate = LocalDate.now();
        long durationDays = plan.getDurationDays() == null ? 0L : plan.getDurationDays().longValue();
        if (durationDays <= 0) {
            throw new IllegalArgumentException("Invalid membership durationDays for selected plan");
        }

        LocalDate expiryDate = startDate.plusDays(durationDays);

        ClientMembership clientMembership = new ClientMembership();
        clientMembership.setClient(client);
        clientMembership.setMembershipPlan(plan);
        clientMembership.setStartDate(startDate);
        clientMembership.setExpiryDate(expiryDate);
        clientMembership.setStatus(MembershipPlanStatus.ACTIVE);
        clientMembership.setPaymentIntentId(paymentReference);
        clientMembershipRepository.save(clientMembership);

        client.setMembershipPlan(plan);
        client.setMembershipStartDate(startDate);
        client.setMembershipEndDate(expiryDate);
        client.setMembershipSuspended(false);
        clientRepository.save(client);

        sendClientActivationEmail(client.getEmail(), plan.getPlanName(), startDate, expiryDate);

        log.info("Activated membership for clientId={} planId={} via local payment reference {}",
                client.getId(), plan.getId(), paymentReference);
    }

    private void sendClientActivationEmail(String email, String planName, LocalDate startDate, LocalDate expiryDate) {
        if (email == null || email.isBlank()) {
            log.warn("Cannot send activation email; missing email address");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Your Fat2Fit Membership is Active");
            message.setText("Your membership plan '" + planName + "' is now active from " + startDate + " to "
                    + expiryDate + ". Thank you for your purchase!");
            javaMailSender.send(message);
            log.info("Sent membership activation email to {}", email);
        } catch (Exception ex) {
            log.error("Failed to send membership activation email to {}", email, ex);
        }
    }
}
