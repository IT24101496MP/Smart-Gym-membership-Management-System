package lk.fat2fit.Fat2Fit.Repository;

import lk.fat2fit.Fat2Fit.Entity.PaymentRecord;
import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, Long> {
	List<PaymentRecord> findByApprovalStatusOrderByCreatedAtDesc(PaymentApprovalStatus approvalStatus);

	Optional<PaymentRecord> findByIdAndApprovalStatus(Long id, PaymentApprovalStatus approvalStatus);
}
