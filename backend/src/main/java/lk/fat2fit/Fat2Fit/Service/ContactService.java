package lk.fat2fit.Fat2Fit.Service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import lk.fat2fit.Fat2Fit.DTO.Contact.ContactMessageRequest;
import lk.fat2fit.Fat2Fit.Entity.ContactMessage;
import lk.fat2fit.Fat2Fit.Repository.ContactMessageRepository;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactMessageRepository contactMessageRepository;
    private final UserRepository userRepository;

    public ContactMessage saveIncomingMessage(ContactMessageRequest request) {
        ContactMessage message = ContactMessage.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(request.getEmail().trim())
                .phoneNumber(request.getPhoneNumber().trim())
                .message(request.getMessage().trim())
                .status(ContactMessage.Status.NEW)
                .build();
        return contactMessageRepository.save(message);
    }

    public List<ContactMessage> getAllMessages() {
        return contactMessageRepository.findAllByOrderByCreatedAtDesc();
    }

    public ContactMessage replyToMessage(Long id, String replyText, String repliedByEmail) {
        ContactMessage message = contactMessageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));

        Integer repliedByUserId = userRepository.findByEmail(repliedByEmail)
                .map(user -> user.getId())
                .orElse(null);

        message.setAdminReply(replyText.trim());
        message.setRepliedAt(LocalDateTime.now());
        message.setRepliedByUserId(repliedByUserId);
        message.setStatus(ContactMessage.Status.REPLIED);

        return contactMessageRepository.save(message);
    }
}
