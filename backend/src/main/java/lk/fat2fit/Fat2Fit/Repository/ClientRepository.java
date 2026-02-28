package lk.fat2fit.Fat2Fit.Repository;

import lk.fat2fit.Fat2Fit.Entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface ClientRepository extends JpaRepository<Client, Integer> {

    boolean existsByMobileNumber(String mobileNumber);

    Optional<Client> findByMobileNumber(String mobileNumber);
    List<Client> findByBloodGroup(String bloodGroup);

}
