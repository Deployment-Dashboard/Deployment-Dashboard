package cz.oksystem.deployment_dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.oksystem.deployment_dashboard.dto.AppDto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ApiControllerIntegrationTests {

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ApiController apiController;


	@Test
	void contextLoads() throws Exception {
    Assertions.assertNotNull(apiController);
	}

  @Test
  void emptyJsonRejects() throws Exception {
    AppDto appDto = new AppDto();

    mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andExpect(status().isBadRequest())
      .andExpect(status().reason("App key is null. App name is null."));
  }
}
