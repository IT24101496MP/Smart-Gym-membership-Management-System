package lk.fat2fit.Fat2Fit.Controller;

import lk.fat2fit.Fat2Fit.DTO.Client.ClientRegister;
import lk.fat2fit.Fat2Fit.Service.ClientService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client")
@AllArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @PostMapping("/register")
    public ResponseEntity<?> registerClient(@RequestBody ClientRegister client){
        return clientService.registerClient(client);
    }
}
