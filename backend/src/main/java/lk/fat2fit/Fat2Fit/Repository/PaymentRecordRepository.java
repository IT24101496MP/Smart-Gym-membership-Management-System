package lk.fat2fit.Fat2Fit.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import lk.fat2fit.Fat2Fit.Entity.PaymentRecord;

@Repository
public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, Long> {
}
