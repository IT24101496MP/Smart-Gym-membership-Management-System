package lk.fat2fit.Fat2Fit.Controller;

import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import lk.fat2fit.Fat2Fit.Service.ManageService;

@ExtendWith(MockitoExtension.class)
class ManageControllerMeasurementIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private ManageService manageService;

    @InjectMocks
    private ManageController manageController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(manageController).build();
    }

    @Test
    void shouldReturnClientMetricsHistory() throws Exception {
        List<Map<String, Object>> history = List.of(
                Map.of("measurementId", 1, "measurementDate", "2026-04-01", "bmi", 24.22),
                Map.of("measurementId", 2, "measurementDate", "2026-04-15", "bmi", 23.90));

        ResponseEntity<?> response = ResponseEntity.ok(history);
        doReturn(response).when(manageService).getClientMetricsHistory(7L);

        mockMvc.perform(get("/api/manage/clients/7/metrics/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].measurementId").value(1))
                .andExpect(jsonPath("$[1].bmi").value(23.90));
    }

    @Test
    void shouldReturnSelfMetricsHistory() throws Exception {
        List<Map<String, Object>> history = List.of(
                Map.of("measurementDate", "2026-04-01", "bmi", 24.22));

        ResponseEntity<?> response = ResponseEntity.ok(history);
        doReturn(response).when(manageService).getMyMetricsHistory();

        mockMvc.perform(get("/api/manage/me/metrics/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].measurementDate").value("2026-04-01"));
    }

    @Test
    void shouldReturnInternalServerErrorWhenSavingMetricsFails() throws Exception {
        when(manageService.saveClientMetrics(org.mockito.ArgumentMatchers.eq(10L), org.mockito.ArgumentMatchers.any()))
                .thenThrow(new RuntimeException("DB down"));

        String body = """
                {
                  "heightCm": 170,
                  "weightKg": 74,
                  "waistCm": 88,
                  "hipCm": 98,
                  "armCm": 30,
                  "shoulderCm": 43,
                  "breastCm": 94,
                  "buttocksCm": 100,
                  "measurementDate": "2026-04-01"
                }
                """;

        mockMvc.perform(post("/api/manage/clients/10/metrics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string("Measurement saving failed. Please try again."));
    }
}