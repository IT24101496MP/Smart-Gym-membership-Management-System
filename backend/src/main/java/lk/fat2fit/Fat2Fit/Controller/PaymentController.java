package lk.fat2fit.Fat2Fit.Controller;

import lk.fat2fit.Fat2Fit.DTO.Payment.CreatePaymentIntentRequest;
import lk.fat2fit.Fat2Fit.DTO.Payment.MockPaymentConfirmRequest;
import lk.fat2fit.Fat2Fit.DTO.Payment.RecordMembershipPaymentRequest;
import lk.fat2fit.Fat2Fit.DTO.Payment.RecordMembershipPaymentResponse;
import lk.fat2fit.Fat2Fit.Entity.PaymentRecord;
import lk.fat2fit.Fat2Fit.Service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody CreatePaymentIntentRequest request) {
        try {
            Map<String, Object> response = paymentService.createPaymentIntent(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@RequestBody MockPaymentConfirmRequest request) {
        try {
            Map<String, Object> response = paymentService.confirmMockPayment(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/record")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<?> recordMembershipPayment(@Valid @RequestBody RecordMembershipPaymentRequest request) {
        try {
            RecordMembershipPaymentResponse response = paymentService.recordMembershipPayment(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Payment recording failed. Please try again.");
        }
    }

    @PostMapping(value = "/submit-bank-transfer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> submitBankTransferPayment(@RequestParam Long clientId,
                                                       @RequestParam Integer membershipPlanId,
                                                       @RequestParam java.math.BigDecimal paymentAmount,
                                                       @RequestParam String paymentDate,
                                                       @RequestParam String referenceNumber,
                                                       @RequestParam MultipartFile proofFile) {
        try {
            RecordMembershipPaymentRequest request = new RecordMembershipPaymentRequest();
            request.setClientId(clientId);
            request.setMembershipPlanId(membershipPlanId);
            request.setPaymentAmount(paymentAmount);
            request.setPaymentDate(java.time.LocalDate.parse(paymentDate));
            request.setPaymentMethod(lk.fat2fit.Fat2Fit.Entity.Enum.PaymentMethod.BANK_TRANSFER);
            request.setReferenceNumber(referenceNumber);

            Map<String, Object> response = paymentService.submitBankTransferPaymentForApproval(request, proofFile);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/approvals/pending")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<List<Map<String, Object>>> getPendingApprovals() {
        return ResponseEntity.ok(paymentService.getPendingPaymentApprovals());
    }

    @GetMapping("/approvals/{paymentId}/proof")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<byte[]> getPendingApprovalProof(@PathVariable Long paymentId) {
        try {
            PaymentRecord record = paymentService.getPendingPaymentProof(paymentId);
            String filename = record.getProofFileName() == null || record.getProofFileName().isBlank()
                    ? "payment-proof-" + paymentId
                    : record.getProofFileName();
            String contentType = record.getProofContentType() == null || record.getProofContentType().isBlank()
                    ? MediaType.APPLICATION_OCTET_STREAM_VALUE
                    : record.getProofContentType();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(record.getProofFileData());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/approvals/{paymentId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<?> approvePendingPayment(@PathVariable Long paymentId) {
        try {
            Map<String, Object> response = paymentService.approvePendingPayment(paymentId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/approvals/{paymentId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<?> rejectPendingPayment(@PathVariable Long paymentId,
                                                  @RequestBody Map<String, String> payload) {
        try {
            String reason = payload == null ? null : payload.get("reason");
            Map<String, Object> response = paymentService.rejectPendingPayment(paymentId, reason);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{paymentId}/receipt")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<byte[]> getReceipt(@PathVariable Long paymentId) {
        try {
            PaymentRecord record = paymentService.getReceiptByPaymentId(paymentId);
            String filename = record.getReceiptFileName() == null || record.getReceiptFileName().isBlank()
                    ? "receipt-" + paymentId + ".pdf"
                    : record.getReceiptFileName();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(record.getReceiptPdfData());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{paymentId}/retry-receipt")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<?> retryReceipt(@PathVariable Long paymentId) {
        try {
            return ResponseEntity.ok(paymentService.retryReceiptGeneration(paymentId));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{paymentId}/resend-email")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<?> resendEmail(@PathVariable Long paymentId) {
        try {
            return ResponseEntity.ok(paymentService.resendPaymentConfirmationEmail(paymentId));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/email-failures")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<List<Map<String, Object>>> getEmailFailures() {
        return ResponseEntity.ok(paymentService.getEmailFailurePayments());
    }

    @GetMapping("/history/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<?> getMemberPaymentHistory(@PathVariable Long clientId) {
        try {
            return ResponseEntity.ok(paymentService.getPaymentHistoryForMember(clientId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping(value = "/payhere/notify")
    public ResponseEntity<String> payhereNotify(@RequestParam Map<String, String> payload,
                                                 HttpServletRequest request) {
        log.info("PayHere notify request received method={} ip={} contentType={} query={} payload={}",
                request.getMethod(),
                request.getRemoteAddr(),
                request.getContentType(),
                request.getQueryString(),
                payload);
        try {
            paymentService.processPayhereNotification(payload);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.warn("Rejected PayHere notification payload: {}", e.getMessage());
            return ResponseEntity.badRequest().body("INVALID");
        }
    }
}