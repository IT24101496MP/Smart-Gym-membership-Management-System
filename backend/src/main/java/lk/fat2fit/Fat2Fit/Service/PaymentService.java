package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.DTO.Payment.CreatePaymentIntentRequest;
import lk.fat2fit.Fat2Fit.DTO.Payment.MockPaymentConfirmRequest;
import lk.fat2fit.Fat2Fit.DTO.Payment.RecordMembershipPaymentRequest;
import lk.fat2fit.Fat2Fit.DTO.Payment.RecordMembershipPaymentResponse;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.ClientMembership;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.PaymentRecord;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentMethod;
import lk.fat2fit.Fat2Fit.Repository.ClientMembershipRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lk.fat2fit.Fat2Fit.Repository.PaymentRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final PaymentRecordRepository paymentRecordRepository;
    private final JavaMailSender javaMailSender;

    @Transactional
    public RecordMembershipPaymentResponse recordMembershipPayment(RecordMembershipPaymentRequest request) {
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new IllegalArgumentException("Client not found."));

        if (!Boolean.TRUE.equals(client.getIsActive())) {
            throw new IllegalStateException("Cannot record payment for inactive user account.");
        }

        MembershipPlan assignedPlan = client.getMembershipPlan();
        if (assignedPlan == null) {
            throw new IllegalStateException("Cannot record payment for inactive membership.");
        }

        if (!assignedPlan.getId().equals(request.getMembershipPlanId())) {
            throw new IllegalArgumentException("Selected membership plan does not match member's active plan.");
        }

        if (request.getPaymentAmount() == null || request.getPaymentAmount().signum() <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }

        if (request.getPaymentDate() == null) {
            throw new IllegalArgumentException("Payment date is required.");
        }

        if (request.getPaymentMethod() == null) {
            throw new IllegalArgumentException("Payment method is required.");
        }

        String referenceNumber = request.getReferenceNumber();
        if (request.getPaymentMethod() == PaymentMethod.BANK_TRANSFER || request.getPaymentMethod() == PaymentMethod.CARD) {
            if (referenceNumber == null || referenceNumber.isBlank()) {
                throw new IllegalArgumentException("Reference number is required for bank transfer or card payments.");
            }
        }

        String recordedBy = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : "UNKNOWN";

        PaymentRecord record = PaymentRecord.builder()
                .client(client)
                .membershipPlan(assignedPlan)
                .amount(request.getPaymentAmount())
                .paymentDate(request.getPaymentDate())
                .paymentMethod(request.getPaymentMethod())
                .referenceNumber(referenceNumber == null || referenceNumber.isBlank() ? null : referenceNumber.trim())
                .recordedBy(recordedBy)
                .build();

        PaymentRecord saved = paymentRecordRepository.save(record);

        return RecordMembershipPaymentResponse.builder()
                .paymentId(saved.getId())
                .clientId((long) client.getId())
                .memberName((client.getFirstName() + " " + client.getLastName()).trim())
                .membershipPlanId(assignedPlan.getId())
                .membershipPlanName(assignedPlan.getPlanName())
                .paymentAmount(saved.getAmount())
                .paymentDate(saved.getPaymentDate())
                .paymentMethod(saved.getPaymentMethod())
                .referenceNumber(saved.getReferenceNumber())
                .message("Payment recorded successfully.")
                .build();
    }

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
        saveConfirmedClientPaymentRecord(client, plan, paymentReference);
        response.put("status", "SUCCESS");
        response.put("message", "Payment confirmed and membership activated.");
        return response;
    }

    private void saveConfirmedClientPaymentRecord(Client client, MembershipPlan plan, String paymentReference) {
        BigDecimal amount = plan.getMonthlyPrice();
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Invalid plan amount");
        }

        PaymentRecord paymentRecord = PaymentRecord.builder()
                .client(client)
                .membershipPlan(plan)
                .amount(amount)
                .paymentDate(LocalDate.now())
                .paymentMethod(PaymentMethod.CARD)
                .referenceNumber(paymentReference)
                .recordedBy("CLIENT_CHECKOUT")
                .build();

        paymentRecordRepository.save(paymentRecord);
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
