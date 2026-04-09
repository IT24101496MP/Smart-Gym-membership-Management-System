package lk.fat2fit.Fat2Fit.Repository;

import lk.fat2fit.Fat2Fit.Entity.PaymentRecord;
import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentApprovalStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, Long> {
	List<PaymentRecord> findByApprovalStatusOrderByCreatedAtDesc(PaymentApprovalStatus approvalStatus);

	List<PaymentRecord> findByClientIdOrderByPaymentDateDescIdDesc(Long clientId);

	Optional<PaymentRecord> findByIdAndApprovalStatus(Long id, PaymentApprovalStatus approvalStatus);

	Optional<PaymentRecord> findFirstByClientIdAndReferenceNumberAndPaymentMethodOrderByIdDesc(
			Long clientId,
			String referenceNumber,
			PaymentMethod paymentMethod);

	boolean existsByClientIdAndMembershipPlanIdAndAmountAndPaymentDateAndPaymentMethod(
			Long clientId,
			Integer membershipPlanId,
			BigDecimal amount,
			LocalDate paymentDate,
			PaymentMethod paymentMethod);

	List<PaymentRecord> findByApprovalStatusAndEmailSentFalseAndEmailFailureReasonIsNotNullOrderByCreatedAtDesc(
			PaymentApprovalStatus approvalStatus);
}
