package lk.fat2fit.Fat2Fit.DTO.User;

import lk.fat2fit.Fat2Fit.Entity.Enum.Role;
import lombok.Data;

@Data
public class SwitchRoleRequest {
    private Role role;
}
