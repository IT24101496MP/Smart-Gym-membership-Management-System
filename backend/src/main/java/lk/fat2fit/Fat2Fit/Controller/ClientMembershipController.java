package lk.fat2fit.Fat2Fit.Controller;

import lk.fat2fit.Fat2Fit.DTO.Membership.MembershipRenewalRequest;
import lk.fat2fit.Fat2Fit.DTO.Membership.MembershipHistoryResponse;
import lk.fat2fit.Fat2Fit.Service.ClientMembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/membership-plans")
@RequiredArgsConstructor
public class ClientMembershipController {

    private final ClientMembershipService clientMembershipService;

    @PostMapping("/renew")
    public ResponseEntity<?> renewMembership(@RequestBody MembershipRenewalRequest request) {
        return clientMembershipService.renewMembership(request);
    }

    @GetMapping("/history/{clientId}")
    public ResponseEntity<List<MembershipHistoryResponse>> getMembershipHistory(@PathVariable Long clientId) {
        List<MembershipHistoryResponse> history = clientMembershipService.getMembershipHistory(clientId);
        return ResponseEntity.ok(history);
    }
}