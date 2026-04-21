package lk.fat2fit.Fat2Fit.DTO.Contact;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactReplyLookupRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "A valid email address is required")
    @Size(max = 160, message = "Email must be 160 characters or less")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9+\\-() ]{7,20}$", message = "Phone number format is invalid")
    private String phoneNumber;
}
