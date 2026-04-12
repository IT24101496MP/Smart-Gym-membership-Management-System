package lk.fat2fit.Fat2Fit.Controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import jakarta.validation.Valid;
import lk.fat2fit.Fat2Fit.DTO.Contact.ContactMessageRequest;
import lk.fat2fit.Fat2Fit.DTO.Contact.ContactReplyRequest;
import lk.fat2fit.Fat2Fit.Entity.ContactMessage;
import lk.fat2fit.Fat2Fit.Service.ContactService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@Validated
public class ContactController {

    private final ContactService contactService;

    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendMessage(@Valid @RequestBody ContactMessageRequest request) {
        contactService.saveIncomingMessage(request);
        return ResponseEntity.ok(Map.of("message", "Your message was submitted successfully."));
    }

    @GetMapping("/messages")
    public ResponseEntity<List<ContactMessage>> getMessages() {
        return ResponseEntity.ok(contactService.getAllMessages());
    }

    @PutMapping("/messages/{id}/reply")
    public ResponseEntity<ContactMessage> replyMessage(@PathVariable Long id,
                                                       @Valid @RequestBody ContactReplyRequest request,
                                                       Principal principal) {
        ContactMessage updated = contactService.replyToMessage(id, request.getReply(), principal.getName());
        return ResponseEntity.ok(updated);
    }
}
