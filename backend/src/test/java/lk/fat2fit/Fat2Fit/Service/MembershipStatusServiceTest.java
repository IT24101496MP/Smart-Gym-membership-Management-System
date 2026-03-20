package lk.fat2fit.Fat2Fit.Service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.Enum.MemberMembershipStatus;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;

class MembershipStatusServiceTest {

    private final MembershipStatusService service = new MembershipStatusService();

    @Test
    void shouldReturnExpiredWhenNoPlanAssigned() {
        Client client = Client.builder().membershipPlan(null).build();

        assertEquals(MemberMembershipStatus.EXPIRED, service.resolveStatus(client));
    }

    @Test
    void shouldReturnSuspendedWhenSuspendedEvenIfDateValid() {
        Client client = Client.builder()
                .membershipPlan(MembershipPlan.builder().id(1).planName("Standard").durationDays(30).build())
                .membershipEndDate(LocalDate.now().plusDays(5))
                .membershipSuspended(true)
                .build();

        assertEquals(MemberMembershipStatus.SUSPENDED, service.resolveStatus(client));
    }

    @Test
    void shouldReturnExpiredWhenEndDateHasPassed() {
        Client client = Client.builder()
                .membershipPlan(MembershipPlan.builder().id(1).planName("Standard").durationDays(30).build())
                .membershipEndDate(LocalDate.now().minusDays(1))
                .membershipSuspended(false)
                .build();

        assertEquals(MemberMembershipStatus.EXPIRED, service.resolveStatus(client));
    }

    @Test
    void shouldReturnActiveWhenNotSuspendedAndNotExpired() {
        Client client = Client.builder()
                .membershipPlan(MembershipPlan.builder().id(1).planName("Standard").durationDays(30).build())
                .membershipEndDate(LocalDate.now().plusDays(1))
                .membershipSuspended(false)
                .build();

        assertEquals(MemberMembershipStatus.ACTIVE, service.resolveStatus(client));
    }
}
