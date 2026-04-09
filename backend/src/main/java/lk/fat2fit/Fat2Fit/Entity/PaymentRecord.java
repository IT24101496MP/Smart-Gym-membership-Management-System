package lk.fat2fit.Fat2Fit.Entity;

import jakarta.persistence.*;
import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentApprovalStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_record")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membership_plan_id", nullable = false)
    private MembershipPlan membershipPlan;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(name = "recorded_by", nullable = false)
    private String recordedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false)
    @Builder.Default
    private PaymentApprovalStatus approvalStatus = PaymentApprovalStatus.APPROVED;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejected_by")
    private String rejectedBy;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Lob
    @Column(name = "proof_file_data", columnDefinition = "LONGBLOB")
    private byte[] proofFileData;

    @Column(name = "proof_file_name")
    private String proofFileName;

    @Column(name = "proof_content_type")
    private String proofContentType;

    @Column(name = "receipt_number", unique = true)
    private String receiptNumber;

    @Lob
    @Column(name = "receipt_pdf_data", columnDefinition = "LONGBLOB")
    private byte[] receiptPdfData;

    @Column(name = "receipt_file_name")
    private String receiptFileName;

    @Column(name = "receipt_generated_at")
    private LocalDateTime receiptGeneratedAt;

    @Column(name = "receipt_generation_error", length = 500)
    private String receiptGenerationError;

    @Column(name = "email_sent", nullable = false)
    @Builder.Default
    private Boolean emailSent = false;

    @Column(name = "email_sent_at")
    private LocalDateTime emailSentAt;

    @Column(name = "email_failure_reason", length = 500)
    private String emailFailureReason;

    @Column(name = "last_email_attempt_at")
    private LocalDateTime lastEmailAttemptAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
