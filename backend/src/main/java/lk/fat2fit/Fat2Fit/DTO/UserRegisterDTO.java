package lk.fat2fit.Fat2Fit.DTO;

import lombok.Data;

@Data
public class UserRegisterDTO {
    private String email;
    private String password;
    private String confirmPassword;
}