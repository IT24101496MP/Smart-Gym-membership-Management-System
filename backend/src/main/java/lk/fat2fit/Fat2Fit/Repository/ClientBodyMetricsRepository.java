package lk.fat2fit.Fat2Fit.Repository;

import lk.fat2fit.Fat2Fit.Entity.ClientBodyMetrics;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClientBodyMetricsRepository extends JpaRepository<ClientBodyMetrics, Integer> {

    Optional<ClientBodyMetrics> findByClientId(int clientId);
}
