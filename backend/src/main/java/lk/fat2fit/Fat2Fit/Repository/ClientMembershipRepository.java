package lk.fat2fit.Fat2Fit.Repository;

import lk.fat2fit.Fat2Fit.Entity.ClientMembership;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientMembershipRepository extends JpaRepository<ClientMembership, Long> {
    List<ClientMembership> findByClientId(Long clientId);

    List<ClientMembership> findByClientIdAndStatusIn(Long clientId, List<MembershipPlanStatus> statuses);

    List<ClientMembership> findByClientIdOrderByIdDesc(Long clientId);
}