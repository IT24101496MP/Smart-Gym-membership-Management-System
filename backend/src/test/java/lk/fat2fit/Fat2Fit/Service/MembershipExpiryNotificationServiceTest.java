package lk.fat2fit.Fat2Fit.Service;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.MembershipExpiryNotificationLog;
import lk.fat2fit.Fat2Fit.Entity.Enum.MemberMembershipStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipExpiryNotificationStatus;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipExpiryNotificationLogRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MembershipExpiryNotificationServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private MembershipStatusService membershipStatusService;

    @Mock
    private MembershipExpiryEmailService membershipExpiryEmailService;

    @Mock
    private MembershipExpiryNotificationLogRepository notificationLogRepository;

    @InjectMocks
    private MembershipExpiryNotificationService notificationService;

    @Test
    void shouldSendEmailAndStoreSentLogForThresholdMatch() {
        LocalDate today = LocalDate.of(2026, 3, 21);
        Client client = buildClient(101, "Nimal", "Perera", "nimal@fat2fit.lk", today.plusDays(7));

        when(clientRepository.findActiveClientsExpiringOnDates(List.of(today.plusDays(7), today.plusDays(3), today.plusDays(1))))
                .thenReturn(List.of(client));
        when(membershipStatusService.resolveStatus(client)).thenReturn(MemberMembershipStatus.ACTIVE);
        when(notificationLogRepository.existsByClientIdAndExpiryDateAndDaysBeforeExpiryAndStatus(
                101L,
                today.plusDays(7),
                7,
                MembershipExpiryNotificationStatus.SENT)).thenReturn(false);

        notificationService.notifyExpiringMemberships(today);

        verify(membershipExpiryEmailService, times(1))
                .sendExpiryReminder("nimal@fat2fit.lk", "Nimal Perera", today.plusDays(7), 7);

        ArgumentCaptor<MembershipExpiryNotificationLog> captor = ArgumentCaptor.forClass(MembershipExpiryNotificationLog.class);
        verify(notificationLogRepository, times(1)).save(captor.capture());

        MembershipExpiryNotificationLog saved = captor.getValue();
        assertEquals(101L, saved.getClientId());
        assertEquals(MembershipExpiryNotificationStatus.SENT, saved.getStatus());
        assertEquals(today.plusDays(7), saved.getExpiryDate());
        assertEquals(7, saved.getDaysBeforeExpiry());
    }

    @Test
    void shouldNotSendDuplicateWhenLogAlreadyExists() {
        LocalDate today = LocalDate.of(2026, 3, 21);
        Client client = buildClient(102, "Kasun", "Silva", "kasun@fat2fit.lk", today.plusDays(3));

        when(clientRepository.findActiveClientsExpiringOnDates(List.of(today.plusDays(7), today.plusDays(3), today.plusDays(1))))
                .thenReturn(List.of(client));
        when(membershipStatusService.resolveStatus(client)).thenReturn(MemberMembershipStatus.ACTIVE);
        when(notificationLogRepository.existsByClientIdAndExpiryDateAndDaysBeforeExpiryAndStatus(
                102L,
                today.plusDays(3),
                3,
                MembershipExpiryNotificationStatus.SENT)).thenReturn(true);

        notificationService.notifyExpiringMemberships(today);

        verify(membershipExpiryEmailService, never()).sendExpiryReminder(any(), any(), any(), anyInt());
        verify(notificationLogRepository, never()).save(any(MembershipExpiryNotificationLog.class));
    }

    private Client buildClient(int id, String firstName, String lastName, String email, LocalDate expiryDate) {
        Client client = Client.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .membershipEndDate(expiryDate)
                .membershipSuspended(false)
                .build();
        client.setId(id);
        return client;
    }
}
