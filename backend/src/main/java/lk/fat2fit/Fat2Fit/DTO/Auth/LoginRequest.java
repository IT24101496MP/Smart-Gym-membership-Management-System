package lk.fat2fit.Fat2Fit.DTO.Auth;

import lombok.Data;

@Data
public class LoginRequest {
    private String identifier;  // email or username
    private String password;
}
