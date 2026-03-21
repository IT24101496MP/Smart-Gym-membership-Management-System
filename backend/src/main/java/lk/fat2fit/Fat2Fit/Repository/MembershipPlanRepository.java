package lk.fat2fit.Fat2Fit.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;

public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Integer> {
    List<MembershipPlan> findAllByOrderByIdDesc();

    List<MembershipPlan> findByStatusOrderByIdDesc(MembershipPlanStatus status);

    List<MembershipPlan> findByStatusOrderByDurationDaysAscMonthlyPriceAscIdAsc(MembershipPlanStatus status);
}
