package lk.fat2fit.Fat2Fit.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import lk.fat2fit.Fat2Fit.Entity.ContactMessage;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {

    List<ContactMessage> findAllByOrderByCreatedAtDesc();
}
