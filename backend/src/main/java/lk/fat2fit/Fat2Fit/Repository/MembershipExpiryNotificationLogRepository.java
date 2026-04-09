package lk.fat2fit.Fat2Fit.Repository;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;

import lk.fat2fit.Fat2Fit.Entity.MembershipExpiryNotificationLog;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipExpiryNotificationStatus;

public interface MembershipExpiryNotificationLogRepository extends JpaRepository<MembershipExpiryNotificationLog, Long> {

    boolean existsByClientIdAndExpiryDateAndDaysBeforeExpiryAndStatus(
            Long clientId,
            LocalDate expiryDate,
            Integer daysBeforeExpiry,
            MembershipExpiryNotificationStatus status);
}
