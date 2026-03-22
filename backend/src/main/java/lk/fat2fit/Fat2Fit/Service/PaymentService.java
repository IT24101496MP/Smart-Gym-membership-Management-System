package lk.fat2fit.Fat2Fit.Service;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lk.fat2fit.Fat2Fit.DTO.Payment.CreatePaymentIntentRequest;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.ClientMembership;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import lk.fat2fit.Fat2Fit.Repository.ClientMembershipRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${stripe.webhook.secret}")
    private String stripeWebhookSecret;

    private final ClientRepository clientRepository;
    private final MembershipPlanRepository membershipPlanRepository;
    private final ClientMembershipRepository clientMembershipRepository;
    private final JavaMailSender javaMailSender;

    @PostConstruct
    public void init() {
        com.stripe.Stripe.apiKey = stripeApiKey;
    }

    public Map<String, Object> createPaymentIntent(CreatePaymentIntentRequest request) throws StripeException {
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

        Map<String, String> metadata = new HashMap<>();
        metadata.put("clientId", String.valueOf(request.getClientId()));
        metadata.put("planId", String.valueOf(request.getPlanId()));

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency(request.getCurrency() == null ? "usd" : request.getCurrency())
                .putAllMetadata(metadata)
                .setDescription("Fat2Fit membership purchase")
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);

        Map<String, Object> response = new HashMap<>();
        response.put("clientSecret", paymentIntent.getClientSecret());
        response.put("paymentIntentId", paymentIntent.getId());
        return response;
    }

    public void handleStripeWebhook(String payload, String sigHeader)
            throws SignatureVerificationException, StripeException {
        Event event = Webhook.constructEvent(payload, sigHeader, stripeWebhookSecret);

        if ("payment_intent.succeeded".equals(event.getType())) {
            processPaymentIntentSucceeded(event);
        } else {
            log.info("Received Stripe event not processed: {}", event.getType());
        }
    }

    @Transactional
    protected void processPaymentIntentSucceeded(Event event) throws StripeException {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
        if (paymentIntent == null) {
            log.warn("Could not deserialize payment intent from stripe event.");
            return;
        }

        String paymentIntentId = paymentIntent.getId();
        if (paymentIntentId == null) {
            log.warn("Received payment_intent.succeeded with null id");
            return;
        }

        String clientIdValue = paymentIntent.getMetadata().get("clientId");
        String planIdValue = paymentIntent.getMetadata().get("planId");

        if (clientIdValue == null || planIdValue == null) {
            log.warn("Missing clientId or planId in payment intent metadata (id={})", paymentIntentId);
            return;
        }

        Integer clientId;
        Integer planId;
        try {
            clientId = Integer.parseInt(clientIdValue);
            planId = Integer.parseInt(planIdValue);
        } catch (NumberFormatException e) {
            log.warn("Invalid metadata values in payment intent: clientId={}, planId={}", clientIdValue, planIdValue);
            return;
        }

        Optional<Client> clientOpt = clientRepository.findById(clientId);
        Optional<MembershipPlan> planOpt = membershipPlanRepository.findById(planId);

        if (clientOpt.isEmpty() || planOpt.isEmpty()) {
            log.warn("Client or plan not found for clientId={} planId={} on payment intent {}", clientId, planId,
                    paymentIntentId);
            return;
        }

        Client client = clientOpt.get();
        MembershipPlan plan = planOpt.get();

        // Idempotency check on PaymentIntent ID
        long clientIdLong = client.getId();
        Optional<ClientMembership> existing = clientMembershipRepository
                .findFirstByClientIdAndPaymentIntentId(clientIdLong, paymentIntentId);
        if (existing.isPresent()) {
            log.info("Webhook retry ignored, membership already created for paymentIntent={}", paymentIntentId);
            return;
        }

        LocalDate startDate = LocalDate.now();
        long durationDays = plan.getDurationDays() == null ? 0L : plan.getDurationDays().longValue();
        if (durationDays <= 0) {
            log.warn("Invalid membership durationDays for plan id={}", plan.getId());
            return;
        }
        LocalDate expiryDate = startDate.plusDays(durationDays);

        ClientMembership clientMembership = new ClientMembership();
        clientMembership.setClient(client);
        clientMembership.setMembershipPlan(plan);
        clientMembership.setStartDate(startDate);
        clientMembership.setExpiryDate(expiryDate);
        clientMembership.setStatus(MembershipPlanStatus.ACTIVE);
        clientMembership.setPaymentIntentId(paymentIntentId);

        clientMembershipRepository.save(clientMembership);

        client.setMembershipPlan(plan);
        client.setMembershipStartDate(startDate);
        client.setMembershipEndDate(expiryDate);
        client.setMembershipSuspended(false);

        clientRepository.save(client);

        sendClientActivationEmail(client.getEmail(), plan.getPlanName(), startDate, expiryDate);

        log.info("Activated membership for clientId={} planId={} due to payment intent {}", clientId, planId,
                paymentIntentId);
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
