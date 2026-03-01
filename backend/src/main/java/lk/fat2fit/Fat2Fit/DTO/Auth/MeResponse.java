package lk.fat2fit.Fat2Fit.DTO.Auth;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MeResponse {
    private int id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
}
