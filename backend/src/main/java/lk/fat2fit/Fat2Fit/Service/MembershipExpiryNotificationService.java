package lk.fat2fit.Fat2Fit.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.MembershipExpiryNotificationLog;
import lk.fat2fit.Fat2Fit.Entity.Enum.MemberMembershipStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipExpiryNotificationStatus;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipExpiryNotificationLogRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MembershipExpiryNotificationService {

    private static final Logger log = LoggerFactory.getLogger(MembershipExpiryNotificationService.class);
    private static final List<Integer> ALERT_DAYS = List.of(7, 3, 1);

    private final ClientRepository clientRepository;
    private final MembershipStatusService membershipStatusService;
    private final MembershipExpiryEmailService membershipExpiryEmailService;
    private final MembershipExpiryNotificationLogRepository notificationLogRepository;

    @Scheduled(cron = "${membership.expiry.notification.cron:0 0 9 * * *}")
    public void runScheduledExpiryNotifications() {
        notifyExpiringMemberships(LocalDate.now());
    }

    void notifyExpiringMemberships(LocalDate today) {
        List<LocalDate> targetDates = ALERT_DAYS.stream()
                .map(today::plusDays)
                .toList();

        List<Client> candidates = clientRepository.findActiveClientsExpiringOnDates(targetDates);
        if (candidates.isEmpty()) {
            log.debug("No memberships matched expiry thresholds {} for {}", ALERT_DAYS, today);
            return;
        }

        for (Client client : candidates) {
            int threshold = (int) ChronoUnit.DAYS.between(today, client.getMembershipEndDate());
            if (!ALERT_DAYS.contains(threshold)) {
                continue;
            }

            if (membershipStatusService.resolveStatus(client) != MemberMembershipStatus.ACTIVE) {
                continue;
            }

            if (notificationLogRepository.existsByClientIdAndExpiryDateAndDaysBeforeExpiryAndStatus(
                    Long.valueOf(client.getId()),
                    client.getMembershipEndDate(),
                    threshold,
                    MembershipExpiryNotificationStatus.SENT)) {
                continue;
            }

            sendAndLog(client, threshold);
        }
    }

    private void sendAndLog(Client client, int daysBeforeExpiry) {
        LocalDate expiryDate = client.getMembershipEndDate();
        String memberName = (client.getFirstName() + " " + client.getLastName()).trim();
        String memberEmail = client.getEmail();

        try {
            membershipExpiryEmailService.sendExpiryReminder(memberEmail, memberName, expiryDate, daysBeforeExpiry);
            notificationLogRepository.save(MembershipExpiryNotificationLog.builder()
                    .clientId(Long.valueOf(client.getId()))
                    .memberName(memberName)
                    .memberEmail(memberEmail)
                    .expiryDate(expiryDate)
                    .daysBeforeExpiry(daysBeforeExpiry)
                    .status(MembershipExpiryNotificationStatus.SENT)
                    .details("Notification sent successfully")
                    .build());
            log.info("Expiry notification sent for clientId={} ({} day reminder)", client.getId(), daysBeforeExpiry);
        } catch (Exception ex) {
            notificationLogRepository.save(MembershipExpiryNotificationLog.builder()
                    .clientId(Long.valueOf(client.getId()))
                    .memberName(memberName)
                    .memberEmail(memberEmail)
                    .expiryDate(expiryDate)
                    .daysBeforeExpiry(daysBeforeExpiry)
                    .status(MembershipExpiryNotificationStatus.FAILED)
                    .details(ex.getMessage())
                    .build());
            long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), expiryDate);
            log.error("Failed to send expiry notification for clientId={} (daysLeft={})", client.getId(), daysLeft, ex);
        }
    }
}
