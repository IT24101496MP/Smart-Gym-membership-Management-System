package lk.fat2fit.Fat2Fit.Repository;

import lk.fat2fit.Fat2Fit.Entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface ClientRepository extends JpaRepository<Client, Integer> {

<<<<<<< HEAD
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByEmailOrPhoneNumber(String email, String phoneNumber);

    Optional<Client> findByEmail(String email);
    Optional<Client> findByPhoneNumber(String phoneNumber);
=======
    boolean existsByMobileNumber(String mobileNumber);

    Optional<Client> findByMobileNumber(String mobileNumber);
>>>>>>> testing
    List<Client> findByBloodGroup(String bloodGroup);
    List<Client> findByStatus(String status);

}
