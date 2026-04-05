package lk.fat2fit.Fat2Fit.Service;

import lk.fat2fit.Fat2Fit.DTO.Payment.CreatePaymentIntentRequest;
import lk.fat2fit.Fat2Fit.DTO.Payment.MockPaymentConfirmRequest;
import lk.fat2fit.Fat2Fit.DTO.Payment.RecordMembershipPaymentRequest;
import lk.fat2fit.Fat2Fit.DTO.Payment.RecordMembershipPaymentResponse;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.ClientMembership;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.PaymentRecord;
import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentApprovalStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentMethod;
import lk.fat2fit.Fat2Fit.Repository.ClientMembershipRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lk.fat2fit.Fat2Fit.Repository.PaymentRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private static final int RECEIPT_PAGE_MARGIN = 50;
    private static final float RECEIPT_LINE_HEIGHT = 18f;

    private final ClientRepository clientRepository;
    private final MembershipPlanRepository membershipPlanRepository;
    private final ClientMembershipRepository clientMembershipRepository;
    private final PaymentRecordRepository paymentRecordRepository;
    private final JavaMailSender javaMailSender;

    @Value("${payhere.merchant-id:}")
    private String payhereMerchantId;

    @Value("${payhere.merchant-secret:}")
    private String payhereMerchantSecret;

    @Value("${payhere.sandbox:true}")
    private boolean payhereSandbox;

    @Value("${payhere.return-url:http://localhost:5173/profile}")
    private String payhereReturnUrl;

    @Value("${payhere.cancel-url:http://localhost:5173/profile}")
    private String payhereCancelUrl;

    @Value("${payhere.notify-url:https://cr9rcxvd-8080.asse.devtunnels.ms/api/payments/payhere/notify}")
    private String payhereNotifyUrl;

    private record ReceiptEmailResult(boolean receiptGenerated,
                                      boolean emailSent,
                                      String receiptNumber,
                                      String warningMessage) {
    }

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

        ensureNoDuplicatePayment(client, assignedPlan, request.getPaymentAmount(), request.getPaymentDate(),
                request.getPaymentMethod(), referenceNumber);

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
            .approvalStatus(PaymentApprovalStatus.APPROVED)
            .approvedBy(recordedBy)
            .approvedAt(LocalDateTime.now())
                .build();

        PaymentRecord saved = paymentRecordRepository.save(record);
        ReceiptEmailResult receiptEmailResult = generateReceiptAndSendConfirmation(saved);

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
                .receiptGenerated(receiptEmailResult.receiptGenerated())
                .receiptNumber(receiptEmailResult.receiptNumber())
                .emailSent(receiptEmailResult.emailSent())
                .warningMessage(receiptEmailResult.warningMessage())
                .message(receiptEmailResult.warningMessage() == null
                    ? "Payment recorded successfully."
                    : "Payment recorded with follow-up required.")
                .build();
    }

    @Transactional
    public Map<String, Object> submitBankTransferPaymentForApproval(RecordMembershipPaymentRequest request,
                                                                    MultipartFile proofFile) {
        if (request.getPaymentMethod() != PaymentMethod.BANK_TRANSFER) {
            throw new IllegalArgumentException("Only bank transfer can be submitted for approval in this flow.");
        }

        if (proofFile == null || proofFile.isEmpty()) {
            throw new IllegalArgumentException("Proof file is required for bank transfer payments.");
        }

        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new IllegalArgumentException("Client not found."));

        if (!Boolean.TRUE.equals(client.getIsActive())) {
            throw new IllegalStateException("Cannot submit payment for inactive user account.");
        }

        MembershipPlan plan = membershipPlanRepository.findById(request.getMembershipPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Membership plan not found."));

        if (plan.getStatus() != MembershipPlanStatus.ACTIVE) {
            throw new IllegalArgumentException("Membership plan is not active.");
        }

        if (request.getPaymentAmount() == null || request.getPaymentAmount().signum() <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }

        if (request.getPaymentDate() == null) {
            throw new IllegalArgumentException("Payment date is required.");
        }

        if (request.getReferenceNumber() == null || request.getReferenceNumber().isBlank()) {
            throw new IllegalArgumentException("Reference number is required for bank transfer payments.");
        }

        byte[] proofData;
        try {
            proofData = proofFile.getBytes();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to read proof file.", ex);
        }

        PaymentRecord record = PaymentRecord.builder()
                .client(client)
                .membershipPlan(plan)
                .amount(request.getPaymentAmount())
                .paymentDate(request.getPaymentDate())
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .referenceNumber(request.getReferenceNumber().trim())
                .recordedBy(getCurrentUsername())
                .approvalStatus(PaymentApprovalStatus.PENDING)
                .proofFileData(proofData)
                .proofFileName(proofFile.getOriginalFilename())
                .proofContentType(proofFile.getContentType())
                .build();

        PaymentRecord saved = paymentRecordRepository.save(record);

        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", saved.getId());
        response.put("status", "PENDING_APPROVAL");
        response.put("message", "Bank transfer submitted successfully. Awaiting staff approval.");
        return response;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPendingPaymentApprovals() {
        return paymentRecordRepository.findByApprovalStatusOrderByCreatedAtDesc(PaymentApprovalStatus.PENDING)
                .stream()
                .map(record -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("paymentId", record.getId());
                    item.put("clientId", record.getClient().getId());
                    item.put("memberName", (record.getClient().getFirstName() + " " + record.getClient().getLastName()).trim());
                    item.put("membershipPlanName", record.getMembershipPlan().getPlanName());
                    item.put("paymentMethod", record.getPaymentMethod());
                    item.put("paymentAmount", record.getAmount());
                    item.put("paymentDate", record.getPaymentDate());
                    item.put("referenceNumber", record.getReferenceNumber());
                    item.put("createdAt", record.getCreatedAt());
                    item.put("hasProof", record.getProofFileData() != null && record.getProofFileData().length > 0);
                    return item;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentRecord getPendingPaymentProof(Long paymentId) {
        PaymentRecord record = paymentRecordRepository.findByIdAndApprovalStatus(paymentId, PaymentApprovalStatus.PENDING)
                .orElseThrow(() -> new IllegalArgumentException("Pending payment record not found."));

        if (record.getProofFileData() == null || record.getProofFileData().length == 0) {
            throw new IllegalArgumentException("No proof file found for this payment.");
        }
        return record;
    }

    @Transactional
    public Map<String, Object> approvePendingPayment(Long paymentId) {
        PaymentRecord record = paymentRecordRepository.findByIdAndApprovalStatus(paymentId, PaymentApprovalStatus.PENDING)
                .orElseThrow(() -> new IllegalArgumentException("Pending payment record not found."));

        String paymentReference = record.getReferenceNumber();
        if (paymentReference == null || paymentReference.isBlank()) {
            paymentReference = "BANK-" + record.getId();
        }

        Optional<ClientMembership> existing = clientMembershipRepository
                .findFirstByClientIdAndPaymentIntentId((long) record.getClient().getId(), paymentReference);

        if (existing.isEmpty()) {
            activateMembership(record.getClient(), record.getMembershipPlan(), paymentReference);
        }

        String approvedBy = getCurrentUsername();
        record.setApprovalStatus(PaymentApprovalStatus.APPROVED);
        record.setApprovedAt(LocalDateTime.now());
        record.setApprovedBy(approvedBy);
        record.setReferenceNumber(paymentReference);
        PaymentRecord saved = paymentRecordRepository.save(record);
        ReceiptEmailResult receiptEmailResult = generateReceiptAndSendConfirmation(saved);

        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", record.getId());
        response.put("status", "APPROVED");
        response.put("receiptGenerated", receiptEmailResult.receiptGenerated());
        response.put("receiptNumber", receiptEmailResult.receiptNumber());
        response.put("emailSent", receiptEmailResult.emailSent());
        response.put("warningMessage", receiptEmailResult.warningMessage());
        response.put("message", receiptEmailResult.warningMessage() == null
            ? "Payment approved and membership activated."
            : "Payment approved and membership activated, but follow-up is required.");
        return response;
    }

    @Transactional
    public Map<String, Object> rejectPendingPayment(Long paymentId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Rejection reason is required.");
        }

        PaymentRecord record = paymentRecordRepository.findByIdAndApprovalStatus(paymentId, PaymentApprovalStatus.PENDING)
                .orElseThrow(() -> new IllegalArgumentException("Pending payment record not found."));

        record.setApprovalStatus(PaymentApprovalStatus.REJECTED);
        record.setRejectedBy(getCurrentUsername());
        record.setRejectedAt(LocalDateTime.now());
        record.setRejectionReason(reason.trim());
        paymentRecordRepository.save(record);

        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", record.getId());
        response.put("status", "REJECTED");
        response.put("message", "Payment rejected successfully.");
        return response;
    }

    @Transactional(readOnly = true)
    public PaymentRecord getReceiptByPaymentId(Long paymentId) {
        PaymentRecord record = paymentRecordRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found."));
        if (record.getReceiptPdfData() == null || record.getReceiptPdfData().length == 0) {
            throw new IllegalArgumentException("Receipt is not available for this payment.");
        }
        return record;
    }

    @Transactional
    public Map<String, Object> retryReceiptGeneration(Long paymentId) {
        PaymentRecord record = paymentRecordRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found."));

        ReceiptEmailResult result = generateReceiptAndSendConfirmation(record);
        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", paymentId);
        response.put("receiptGenerated", result.receiptGenerated());
        response.put("receiptNumber", result.receiptNumber());
        response.put("emailSent", result.emailSent());
        response.put("warningMessage", result.warningMessage());
        response.put("message", result.warningMessage() == null
                ? "Receipt regenerated and email processed."
                : "Receipt retry completed with follow-up required.");
        return response;
    }

    @Transactional
    public Map<String, Object> resendPaymentConfirmationEmail(Long paymentId) {
        PaymentRecord record = paymentRecordRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found."));

        if (record.getReceiptPdfData() == null || record.getReceiptPdfData().length == 0) {
            throw new IllegalStateException("Receipt is missing. Retry receipt generation first.");
        }

        String emailWarning = sendPaymentConfirmationEmail(record);
        paymentRecordRepository.save(record);

        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", paymentId);
        response.put("emailSent", Boolean.TRUE.equals(record.getEmailSent()));
        response.put("warningMessage", emailWarning);
        response.put("message", emailWarning == null
                ? "Payment confirmation email sent successfully."
                : "Email resend completed with follow-up required.");
        return response;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getEmailFailurePayments() {
        return paymentRecordRepository
                .findByApprovalStatusAndEmailSentFalseAndEmailFailureReasonIsNotNullOrderByCreatedAtDesc(PaymentApprovalStatus.APPROVED)
                .stream()
                .map(record -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("paymentId", record.getId());
                    item.put("receiptNumber", record.getReceiptNumber());
                    item.put("memberName", (record.getClient().getFirstName() + " " + record.getClient().getLastName()).trim());
                    item.put("memberEmail", record.getClient().getEmail());
                    item.put("paymentAmount", record.getAmount());
                    item.put("paymentDate", record.getPaymentDate());
                    item.put("emailFailureReason", record.getEmailFailureReason());
                    item.put("receiptAvailable", record.getReceiptPdfData() != null && record.getReceiptPdfData().length > 0);
                    return item;
                })
                .toList();
    }

    public Map<String, Object> createPaymentIntent(CreatePaymentIntentRequest request) {
        if (request.getClientId() == null || request.getPlanId() == null) {
            throw new IllegalArgumentException("clientId and planId are required");
        }

        if (payhereMerchantId == null || payhereMerchantId.isBlank() || payhereMerchantSecret == null || payhereMerchantSecret.isBlank()) {
            throw new IllegalArgumentException("PayHere merchant configuration is missing");
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

        BigDecimal amountFormatted = amountBD.setScale(2, RoundingMode.HALF_UP);
        if (amountFormatted.signum() <= 0) {
            throw new IllegalArgumentException("Invalid plan amount");
        }

        Client client = clientOpt.get();
        String orderId = "MEM-" + client.getId() + "-" + plan.getId() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        String currency = request.getCurrency() == null || request.getCurrency().isBlank()
                ? "LKR"
                : request.getCurrency().toUpperCase(Locale.ROOT);
        String amountText = amountFormatted.toPlainString();
        String hash = generateCheckoutHash(payhereMerchantId, orderId, amountText, currency, payhereMerchantSecret);

        Map<String, Object> response = new HashMap<>();
        response.put("checkoutUrl", payhereSandbox
                ? "https://sandbox.payhere.lk/pay/checkout"
                : "https://www.payhere.lk/pay/checkout");
        response.put("merchantId", payhereMerchantId);
        response.put("returnUrl", payhereReturnUrl);
        response.put("cancelUrl", payhereCancelUrl);
        response.put("notifyUrl", payhereNotifyUrl);
        response.put("firstName", client.getFirstName());
        response.put("lastName", client.getLastName());
        response.put("email", client.getEmail());
        response.put("phone", client.getPhoneNumber());
        response.put("address", client.getAddress());
        response.put("city", "Colombo");
        response.put("country", "Sri Lanka");
        response.put("orderId", orderId);
        response.put("items", "Membership - " + plan.getPlanName());
        response.put("currency", currency);
        response.put("amount", amountText);
        response.put("hash", hash);
        response.put("paymentIntentId", orderId);
        response.put("status", "PENDING_CONFIRMATION");
        return response;
    }

    @Transactional
    public void processPayhereNotification(Map<String, String> payload) {
        String merchantId = payload.get("merchant_id");
        String orderId = payload.get("order_id");
        String payhereAmount = payload.get("payhere_amount");
        String payhereCurrency = payload.get("payhere_currency");
        String statusCode = payload.get("status_code");
        String md5sig = payload.get("md5sig");
        String paymentId = payload.get("payment_id");
        String custom1 = payload.get("custom_1");
        String custom2 = payload.get("custom_2");
        String method = payload.get("method");
        String statusMessage = payload.get("status_message");

        if (merchantId == null || orderId == null || payhereAmount == null || payhereCurrency == null
                || statusCode == null || md5sig == null) {
            throw new IllegalArgumentException("Missing required PayHere notification fields");
        }

        if (!payhereMerchantId.equals(merchantId)) {
            throw new IllegalArgumentException("Invalid merchant id in notification");
        }

        String localMd5Sig = generateNotificationHash(
                merchantId,
                orderId,
                payhereAmount,
                payhereCurrency,
                statusCode,
                payhereMerchantSecret);

        if (!localMd5Sig.equalsIgnoreCase(md5sig)) {
            throw new IllegalArgumentException("Invalid PayHere signature");
        }

        log.info("Verified PayHere notification orderId={} paymentId={} statusCode={} method={} statusMessage={}",
                orderId, paymentId, statusCode, method, statusMessage);

        if (!"2".equals(statusCode)) {
            log.info("Ignoring non-success PayHere notification for orderId={} statusCode={}", orderId, statusCode);
            return;
        }

        OrderInfo orderInfo = parseOrderInfo(orderId, custom1, custom2);
        // Use order id as canonical reference for idempotent order finalization.
        MockPaymentConfirmRequest confirmRequest = new MockPaymentConfirmRequest(
            orderInfo.clientId(),
            orderInfo.planId(),
            orderId);
        Map<String, Object> confirmResult = confirmMockPayment(confirmRequest);
        log.info("Processed successful PayHere notification for orderId={} paymentId={} result={}",
            orderId,
            paymentId,
            confirmResult.get("status"));
    }

    private String generateCheckoutHash(String merchantId, String orderId, String amount, String currency, String merchantSecret) {
        String hashedSecret = md5Hex(merchantSecret).toUpperCase(Locale.ROOT);
        String payload = merchantId + orderId + amount + currency + hashedSecret;
        return md5Hex(payload).toUpperCase(Locale.ROOT);
    }

    private String generateNotificationHash(String merchantId,
                                            String orderId,
                                            String payhereAmount,
                                            String payhereCurrency,
                                            String statusCode,
                                            String merchantSecret) {
        String hashedSecret = md5Hex(merchantSecret).toUpperCase(Locale.ROOT);
        String payload = merchantId + orderId + payhereAmount + payhereCurrency + statusCode + hashedSecret;
        return md5Hex(payload).toUpperCase(Locale.ROOT);
    }

    private String md5Hex(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to compute MD5", ex);
        }
    }

    private OrderInfo parseOrderInfo(String orderId, String custom1, String custom2) {
        if (orderId != null && !orderId.isBlank()) {
            String[] parts = orderId.split("-");
            if (parts.length >= 4 && "MEM".equals(parts[0])) {
                try {
                    Integer clientId = Integer.valueOf(parts[1]);
                    Integer planId = Integer.valueOf(parts[2]);
                    return new OrderInfo(clientId, planId);
                } catch (NumberFormatException ex) {
                    log.warn("Could not parse clientId/planId from order id {}", orderId);
                }
            }
        }

        if (custom1 == null || custom2 == null || custom1.isBlank() || custom2.isBlank()) {
            throw new IllegalArgumentException("Cannot resolve order identifiers from order_id/custom fields");
        }

        try {
            return new OrderInfo(Integer.valueOf(custom1), Integer.valueOf(custom2));
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid custom order identifiers");
        }
    }

    private record OrderInfo(Integer clientId, Integer planId) {
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
                .approvalStatus(PaymentApprovalStatus.APPROVED)
                .approvedBy("SYSTEM")
                .approvedAt(LocalDateTime.now())
                .build();

        PaymentRecord saved = paymentRecordRepository.save(paymentRecord);
        generateReceiptAndSendConfirmation(saved);
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

    private void ensureNoDuplicatePayment(Client client,
                                          MembershipPlan plan,
                                          BigDecimal amount,
                                          LocalDate paymentDate,
                                          PaymentMethod method,
                                          String referenceNumber) {
        if (referenceNumber != null && !referenceNumber.isBlank()) {
            Optional<PaymentRecord> duplicateByReference = paymentRecordRepository
                    .findFirstByClientIdAndReferenceNumberAndPaymentMethodOrderByIdDesc(
                            (long) client.getId(),
                            referenceNumber.trim(),
                            method);
            if (duplicateByReference.isPresent()) {
                throw new IllegalStateException("Duplicate payment submission detected for this reference number.");
            }
            return;
        }

        boolean duplicateNoReference = paymentRecordRepository
                .existsByClientIdAndMembershipPlanIdAndAmountAndPaymentDateAndPaymentMethod(
                        (long) client.getId(),
                        plan.getId(),
                        amount,
                        paymentDate,
                        method);
        if (duplicateNoReference) {
            throw new IllegalStateException("Duplicate payment submission detected.");
        }
    }

    private ReceiptEmailResult generateReceiptAndSendConfirmation(PaymentRecord paymentRecord) {
        PaymentRecord managed = paymentRecordRepository.findById(paymentRecord.getId())
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found."));

        if (managed.getReceiptNumber() == null || managed.getReceiptNumber().isBlank()) {
            managed.setReceiptNumber(generateReceiptNumber(managed));
        }

        String warning = null;
        try {
            byte[] pdf = createReceiptPdf(managed);
            managed.setReceiptPdfData(pdf);
            managed.setReceiptFileName("receipt-" + managed.getReceiptNumber() + ".pdf");
            managed.setReceiptGeneratedAt(LocalDateTime.now());
            managed.setReceiptGenerationError(null);
        } catch (Exception ex) {
            managed.setReceiptGenerationError("Receipt generation failed: " + ex.getMessage());
            managed.setEmailSent(false);
            managed.setEmailFailureReason("Email skipped because receipt generation failed.");
            paymentRecordRepository.save(managed);
            warning = "Receipt generation failed. Please use retry receipt option.";
            return new ReceiptEmailResult(false, false, managed.getReceiptNumber(), warning);
        }

        String emailWarning = sendPaymentConfirmationEmail(managed);
        paymentRecordRepository.save(managed);
        return new ReceiptEmailResult(true, Boolean.TRUE.equals(managed.getEmailSent()), managed.getReceiptNumber(), emailWarning);
    }

    private String generateReceiptNumber(PaymentRecord paymentRecord) {
        String datePart = LocalDate.now().toString().replace("-", "");
        return "RCPT-" + datePart + "-" + String.format("%06d", paymentRecord.getId());
    }

    private byte[] createReceiptPdf(PaymentRecord paymentRecord) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                stream.beginText();
                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 16);
                stream.newLineAtOffset(RECEIPT_PAGE_MARGIN, page.getMediaBox().getHeight() - RECEIPT_PAGE_MARGIN);
                stream.showText("Fat2Fit Payment Receipt");

                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                float y = page.getMediaBox().getHeight() - RECEIPT_PAGE_MARGIN - (RECEIPT_LINE_HEIGHT * 2);

                y = writeLine(stream, y, "Receipt No: " + paymentRecord.getReceiptNumber());
                y = writeLine(stream, y, "Payment ID: " + paymentRecord.getId());
                y = writeLine(stream, y, "Member: " + paymentRecord.getClient().getFirstName() + " " + paymentRecord.getClient().getLastName());
                y = writeLine(stream, y, "Member Email: " + safeText(paymentRecord.getClient().getEmail()));
                y = writeLine(stream, y, "Plan: " + paymentRecord.getMembershipPlan().getPlanName());
                y = writeLine(stream, y, "Payment Method: " + paymentRecord.getPaymentMethod());
                y = writeLine(stream, y, "Reference: " + safeText(paymentRecord.getReferenceNumber()));
                y = writeLine(stream, y, "Amount: " + paymentRecord.getAmount());
                y = writeLine(stream, y, "Payment Date: " + paymentRecord.getPaymentDate());
                y = writeLine(stream, y, "Recorded By: " + paymentRecord.getRecordedBy());
                writeLine(stream, y, "Generated At: " + LocalDateTime.now());

                stream.endText();
            }

            document.save(out);
            return out.toByteArray();
        }
    }

    private float writeLine(PDPageContentStream stream, float y, String line) throws IOException {
        stream.newLineAtOffset(0, -RECEIPT_LINE_HEIGHT);
        stream.showText(line);
        return y - RECEIPT_LINE_HEIGHT;
    }

    private String safeText(String value) {
        return (value == null || value.isBlank()) ? "N/A" : value;
    }

    private String sendPaymentConfirmationEmail(PaymentRecord paymentRecord) {
        paymentRecord.setLastEmailAttemptAt(LocalDateTime.now());

        String email = paymentRecord.getClient().getEmail();
        if (email == null || email.isBlank()) {
            paymentRecord.setEmailSent(false);
            paymentRecord.setEmailFailureReason("Member email is missing.");
            return "Member email is missing. Update profile and resend email.";
        }

        if (!isValidEmail(email)) {
            paymentRecord.setEmailSent(false);
            paymentRecord.setEmailFailureReason("Member email is invalid.");
            return "Member email is invalid. Update profile and resend email.";
        }

        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);
            helper.setTo(email);
            helper.setSubject("Fat2Fit Payment Confirmation - " + paymentRecord.getReceiptNumber());
            helper.setText(buildPaymentEmailBody(paymentRecord));
            helper.addAttachment(
                    paymentRecord.getReceiptFileName() == null ? "payment-receipt.pdf" : paymentRecord.getReceiptFileName(),
                    () -> new java.io.ByteArrayInputStream(paymentRecord.getReceiptPdfData()),
                    "application/pdf");

            javaMailSender.send(mimeMessage);
            paymentRecord.setEmailSent(true);
            paymentRecord.setEmailSentAt(LocalDateTime.now());
            paymentRecord.setEmailFailureReason(null);
            return null;
        } catch (Exception ex) {
            log.error("Failed to send payment confirmation email for paymentId={}", paymentRecord.getId(), ex);
            paymentRecord.setEmailSent(false);
            paymentRecord.setEmailFailureReason("Failed to send email: " + ex.getMessage());
            return "Email sending failed. Please use resend option.";
        }
    }

    private String buildPaymentEmailBody(PaymentRecord paymentRecord) {
        return "Dear " + paymentRecord.getClient().getFirstName() + ",\n\n"
                + "Your payment has been successfully recorded.\n\n"
                + "Receipt Number: " + paymentRecord.getReceiptNumber() + "\n"
                + "Payment Method: " + paymentRecord.getPaymentMethod() + "\n"
                + "Amount: " + paymentRecord.getAmount() + "\n"
                + "Payment Date: " + paymentRecord.getPaymentDate() + "\n\n"
                + "Please find your digital receipt attached.\n\n"
                + "Regards,\nFat2Fit Team";
    }

    private boolean isValidEmail(String email) {
        try {
            InternetAddress address = new InternetAddress(email);
            address.validate();
            return true;
        } catch (AddressException ex) {
            return false;
        }
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

    private String getCurrentUsername() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            return "UNKNOWN";
        }
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
