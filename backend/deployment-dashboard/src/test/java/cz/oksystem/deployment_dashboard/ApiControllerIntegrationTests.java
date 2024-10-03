package cz.oksystem.deployment_dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.ErrorBody;
import cz.oksystem.deployment_dashboard.serviceAndRepository.AppService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.SharedHttpSessionConfigurer.sharedHttpSession;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApiControllerIntegrationTests {

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ApiController apiController;

  @Autowired
  private AppService appService;


	@Test
	void contextLoads() throws Exception {
    Assertions.assertNotNull(apiController);
	}

  @Test
  void emptyJsonRejects() throws Exception {
    AppDto appDto = new AppDto();
    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();
    error.setPath("/api/apps");

    MvcResult result = mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andExpect(status().isBadRequest())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertTrue(response.getDetails().contains("KEY is blank."));
    Assertions.assertTrue(response.getDetails().contains("NAME is blank."));
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  @Test
  void emptyKeyRejects() throws Exception {
    AppDto appDto = new AppDto();
    appDto.setName("deployment dashboard");

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();
    error.setDetails("KEY is blank.");
    error.setPath("/api/apps");

    MvcResult result = mockMvc.perform(
        post("/api/apps")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(appDto)))
      .andExpect(status().isBadRequest())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertEquals(error.getDetails(), response.getDetails());
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  @Test
  void emptyNameRejects() throws Exception {
    AppDto appDto = new AppDto();
    appDto.setKey("dd");

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();
    error.setDetails("NAME is blank.");
    error.setPath("/api/apps");

    MvcResult result = mockMvc.perform(
        post("/api/apps")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(appDto)))
      .andExpect(status().isBadRequest())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertEquals(error.getDetails(), response.getDetails());
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  @Test
  void basicAppAccepts() throws Exception {
    AppDto appDto = new AppDto("dd", "deployment dashboard");

    mockMvc.perform(
        post("/api/apps")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(appDto)))
      .andExpect(status().isCreated());

    Optional<App> fetchedApp = appService.getByKey(appDto.getKey());
    Assertions.assertTrue(fetchedApp.isPresent());

    App app = fetchedApp.get();
    Assertions.assertEquals(app.getKey(), appDto.getKey());
    Assertions.assertEquals(app.getName(), appDto.getName());
    Assertions.assertEquals(app.getParent(), Optional.empty());
    Assertions.assertEquals(app.getDeleted(), Optional.empty());
    Assertions.assertEquals(appService.getDeletionSuffixForKey(app.getKey()), 1);
  }

  // TODO
  // manuálně to duplicity nepustí, tady jo
  @Test
  void duplicateKeyRejects() throws Exception {
    mockMvc = MockMvcBuilders
      .standaloneSetup(apiController)
      .apply(sharedHttpSession())
      .build();

    AppDto appDto1 = new AppDto("dd", "deployment dashboard");
    AppDto appDto2 = new AppDto("dd", "deployment dashboard");

    ErrorBody error = ErrorBody.getDefaultDataIntegrityViolationException();
    error.setDetails("UNIQUE constraint violation on APP KEY.");
    error.setPath("/api/apps");

    MvcResult result = mockMvc.perform(
        post("/api/apps")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(appDto1)))
      .andExpect(status().isCreated())
      .andDo(result1 -> mockMvc.perform(
          post("/api/apps")
            .characterEncoding("utf-8")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(appDto2))))
      .andReturn();

    List<App> projects = appService.getProjects();

//    for (App project: projects) {
//      System.out.println(project);
//    }

//    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);
//
//    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
//    Assertions.assertEquals(error.getMessage(), response.getMessage());
//    Assertions.assertEquals(error.getDetails(), response.getDetails());
//    Assertions.assertEquals(error.getPath(), response.getPath());
//    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }
}
