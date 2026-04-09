package lk.fat2fit.Fat2Fit.Controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;

import lk.fat2fit.Fat2Fit.DTO.Payment.RecordMembershipPaymentResponse;
import lk.fat2fit.Fat2Fit.Entity.Enum.PaymentMethod;
import lk.fat2fit.Fat2Fit.Service.PaymentService;

@ExtendWith(MockitoExtension.class)
class PaymentControllerIntegrationTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private PaymentController paymentController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(paymentController).build();
    }

    @Test
    void shouldReturnSuccessWhenPaymentRecorded() throws Exception {
        RecordMembershipPaymentResponse response = RecordMembershipPaymentResponse.builder()
                .paymentId(1L)
                .clientId(10L)
                .memberName("John Doe")
                .membershipPlanId(5)
                .membershipPlanName("Premium")
                .paymentAmount(BigDecimal.valueOf(4500.00))
                .paymentDate(LocalDate.of(2026, 3, 30))
                .paymentMethod(PaymentMethod.CASH)
                .referenceNumber(null)
                .message("Payment recorded successfully.")
                .build();

        when(paymentService.recordMembershipPayment(any())).thenReturn(response);

        String body = """
                {
                  "clientId": 10,
                  "membershipPlanId": 5,
                  "paymentAmount": 4500.00,
                  "paymentDate": "2026-03-30",
                  "paymentMethod": "CASH"
                }
                """;

        mockMvc.perform(post("/api/payments/record")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentId").value(1L))
                .andExpect(jsonPath("$.memberName").value("John Doe"));
    }

    @Test
    void shouldReturnBadRequestWhenMembershipInactive() throws Exception {
        when(paymentService.recordMembershipPayment(any()))
                                .thenThrow(new IllegalStateException("Cannot record payment for inactive user account."));

        String body = """
                {
                  "clientId": 10,
                  "membershipPlanId": 5,
                  "paymentAmount": 4500.00,
                  "paymentDate": "2026-03-30",
                  "paymentMethod": "CASH"
                }
                """;

        mockMvc.perform(post("/api/payments/record")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Cannot record payment for inactive user account."));
    }

    @Test
    void shouldReturnBadRequestWhenAmountInvalid() throws Exception {
        String body = """
                {
                  "clientId": 10,
                  "membershipPlanId": 5,
                  "paymentAmount": 0,
                  "paymentDate": "2026-03-30",
                  "paymentMethod": "CASH"
                }
                """;

        mockMvc.perform(post("/api/payments/record")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnInternalServerErrorWhenUnexpectedFailureOccurs() throws Exception {
        when(paymentService.recordMembershipPayment(any()))
                .thenThrow(new RuntimeException("DB unavailable"));

        String body = objectMapper.writeValueAsString(new PaymentRecordRequestFixture());

        mockMvc.perform(post("/api/payments/record")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string("Payment recording failed. Please try again."));
    }

    private static class PaymentRecordRequestFixture {
        public Long clientId = 10L;
        public Integer membershipPlanId = 5;
        public BigDecimal paymentAmount = BigDecimal.valueOf(4500.00);
        public String paymentDate = "2026-03-30";
        public String paymentMethod = "CASH";
        public String referenceNumber = null;
    }
}
