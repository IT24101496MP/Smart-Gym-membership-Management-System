package lk.fat2fit.Fat2Fit.DTO.Contact;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactReplyRequest {

    @NotBlank(message = "Reply is required")
    @Size(max = 3000, message = "Reply must be 3000 characters or less")
    private String reply;
}
