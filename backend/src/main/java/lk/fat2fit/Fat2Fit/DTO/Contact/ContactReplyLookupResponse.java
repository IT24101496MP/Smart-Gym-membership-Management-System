package lk.fat2fit.Fat2Fit.DTO.Contact;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContactReplyLookupResponse {
    private Long id;
    private String status;
    private String message;
    private String adminReply;
    private LocalDateTime createdAt;
    private LocalDateTime repliedAt;
}
