package lk.fat2fit.Fat2Fit.Repository;

import lk.fat2fit.Fat2Fit.Entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

public interface ClientRepository extends JpaRepository<Client, Long> {

    Optional<Client> findById(Integer id);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByEmailOrPhoneNumber(String email, String phoneNumber);

    Optional<Client> findByEmail(String email);

    Optional<Client> findByPhoneNumber(String phoneNumber);

    List<Client> findByBloodGroup(String bloodGroup);

    @Query("SELECT c FROM Client c WHERE " +
            "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "c.phoneNumber LIKE CONCAT('%', :keyword, '%') OR " +
            "CAST(c.id as string) LIKE CONCAT('%', :keyword, '%')")
    List<Client> searchClients(@Param("keyword") String keyword);
}
        @Query("""
                        SELECT c FROM Client c
                        WHERE c.membershipPlan IS NOT NULL
                            AND c.membershipEndDate IN :dates
                            AND (c.membershipSuspended IS NULL OR c.membershipSuspended = false)
                        """)
        List<Client> findActiveClientsExpiringOnDates(@Param("dates") List<LocalDate> dates);

}
