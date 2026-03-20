package lk.fat2fit.Fat2Fit.Service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;

import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.Enum.MemberMembershipStatus;

@Service
public class MembershipStatusService {

    public MemberMembershipStatus resolveStatus(Client client) {
        if (client == null || client.getMembershipPlan() == null) {
            return MemberMembershipStatus.EXPIRED;
        }

        if (Boolean.TRUE.equals(client.getMembershipSuspended())) {
            return MemberMembershipStatus.SUSPENDED;
        }

        LocalDate today = LocalDate.now();
        LocalDate endDate = client.getMembershipEndDate();
        if (endDate == null || endDate.isBefore(today)) {
            return MemberMembershipStatus.EXPIRED;
        }

        return MemberMembershipStatus.ACTIVE;
    }
}
