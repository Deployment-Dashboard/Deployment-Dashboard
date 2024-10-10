package cz.oksystem.deployment_dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.entity.ErrorBody;
import cz.oksystem.deployment_dashboard.serviceAndRepository.AppService;
import cz.oksystem.deployment_dashboard.serviceAndRepository.DeploymentService;
import cz.oksystem.deployment_dashboard.serviceAndRepository.EnvironmentService;
import cz.oksystem.deployment_dashboard.serviceAndRepository.VersionService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


// TODO testy pro verze a deploymenty

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

  @Autowired
  private EnvironmentService envService;

  @Autowired
  private VersionService verService;

  @Autowired
  private DeploymentService depService;

  @Autowired
  private EntityManager entityManager;


  @BeforeEach
  void setup() {
    appService.resetDeletionCounter();
  }

	@Test
	void contextLoads() throws Exception {
    Assertions.assertNotNull(objectMapper);
    Assertions.assertNotNull(mockMvc);
    Assertions.assertNotNull(apiController);
    Assertions.assertNotNull(appService);
    Assertions.assertNotNull(envService);
    Assertions.assertNotNull(verService);
    Assertions.assertNotNull(depService);
	}

  // addApp tests

  // verify that empty JSON gets rejected
  @Test
  void addEmptyJsonFails() throws Exception {
    AppDto appDto = new AppDto();

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();
    error.setPath("/api/apps");

    MvcResult result = mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    String details = response.getDetails();

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertTrue(details.contains("App could not be added:"));
    Assertions.assertTrue(details.contains("Key is blank."));
    Assertions.assertTrue(details.contains("Name is blank."));
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  // verify that empty key field get rejected
  @Test
  void addEmptyKeyFails() throws Exception {
    AppDto appDto = new AppDto();
    appDto.setName("deployment dashboard");

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();
    error.setDetails("App could not be added: Key is blank.");
    error.setPath("/api/apps");

    MvcResult result = mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertEquals(error.getDetails(), response.getDetails());
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  // verify that empty name field gets rejected
  @Test
  void addEmptyNameFails() throws Exception {
    AppDto appDto = new AppDto();
    appDto.setKey("dd");

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();
    error.setDetails("App could not be added: Name is blank.");
    error.setPath("/api/apps");

    MvcResult result = mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertEquals(error.getDetails(), response.getDetails());
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  // verify that an app is persisted from valid JSON
  @Test
  void addValidAppSucceeds() throws Exception {
    AppDto appDto = new AppDto("dd", "deployment dashboard");

    mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isCreated());

    Optional<App> fetchedApp = appService.get(appDto.getKey());
    Assertions.assertTrue(fetchedApp.isPresent());

    App app = fetchedApp.get();
    Assertions.assertEquals(appDto.getKey(), app.getKey());
    Assertions.assertEquals(appDto.getName(), app.getName());
    Assertions.assertEquals(Optional.empty(), app.getParent());
    Assertions.assertEquals(Optional.empty(), app.getDeleted());
  }

  // verify that the project-component relationship is created correctly
  @Test
  void addComponentSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    AppDto componentDto = new AppDto("dd-fe", "front end", "dd");

    mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(componentDto)))
      .andDo(print())
      .andExpect(status().isCreated());

    Optional<App> component = appService.get("dd-fe");

    Assertions.assertTrue(component.isPresent());
    Assertions.assertEquals(component.get(), app.getComponents().getFirst());
  }

  @Test
  void addComponentToNonexistentApp() throws Exception {
    AppDto componentDto = new AppDto("dd-fe", "front end", "dd");
    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();
    error.setPath("/api/apps/");

    mockMvc.perform(
      post("/api/apps/")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(componentDto)))
      .andDo(print())
      .andExpect(status().isNotFound());
  }

  // verify that multiple components are added correctly
  @Test
  void addMultipleComponentsSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    AppDto componentDtoFe = new AppDto("dd-fe", "front end", "dd");
    AppDto componentDtoDb = new AppDto("dd-db", "database", "dd");

    mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(componentDtoFe)))
      .andDo(print())
      .andExpect(status().isCreated());

    mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(componentDtoDb)))
      .andDo(print())
      .andExpect(status().isCreated());

    Optional<App> fe = appService.get("dd-fe");
    Optional<App> db = appService.get("dd-db");

    Assertions.assertTrue(fe.isPresent());
    Assertions.assertTrue(db.isPresent());
    Assertions.assertFalse(app.getComponents().isEmpty());
    Assertions.assertEquals(fe.get(), app.getComponents().get(0));
    Assertions.assertEquals(db.get(), app.getComponents().get(1));
  }

  // verify that an app that is a parent of itself gets rejected
  @Test
  void addRecursiveAppFails() throws Exception {
    AppDto appDto = new AppDto("dd", "deployment dashboard", "dd");

    ErrorBody error = ErrorBody.getDefaultDataIntegrityViolationException();
    error.setDetails("App could not be added: App cannot be a parent of itself.");
    error.setPath("/api/apps");

    MvcResult result = mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isConflict())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertEquals(error.getDetails(), response.getDetails());
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  // verify that a duplicate app is rejected
  @Test
  void addDuplicateAppFails() throws Exception {
    AppDto appDto = new AppDto("dd", "deployment dashboard");

    String appJson = objectMapper.writeValueAsString(appDto);

    ErrorBody error = ErrorBody.getDefaultDataIntegrityViolationException();
    error.setDetails("App could not be added: key 'dd' already exists.");
    error.setPath("/api/apps");

    mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(appJson))
      .andDo(print())
      .andExpect(status().isCreated());

    MvcResult result = mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(appJson))
      .andExpect(status().isConflict())
      .andDo(print())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertEquals(error.getDetails(), response.getDetails());
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  // updateApp tests

  // verify that empty JSON gets rejected
  @Test
  void updateEmptyJsonFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    AppDto appDto = new AppDto();

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();
    error.setPath("/api/apps/dd");

    MvcResult result = mockMvc.perform(
      put("/api/apps/dd")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    String details = response.getDetails();

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertTrue(details.contains("App could not be updated:"));
    Assertions.assertTrue(details.contains("Key is blank."));
    Assertions.assertTrue(details.contains("Name is blank."));
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  // verify that empty key field gets rejected
  @Test
  void updateEmptyKeyFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    AppDto appDto = new AppDto();
    appDto.setName("deployment dashboard");

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();
    error.setDetails("App could not be updated: Key is blank.");
    error.setPath("/api/apps/dd");

    MvcResult result = mockMvc.perform(
      put("/api/apps/dd")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertEquals(error.getDetails(), response.getDetails());
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  // verify that empty name field gets rejected
  @Test
  void updateEmptyNameFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    AppDto appDto = new AppDto();
    appDto.setKey("dd");

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();
    error.setDetails("App could not be updated: Name is blank.");
    error.setPath("/api/apps/dd");

    MvcResult result = mockMvc.perform(
      put("/api/apps/dd")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertEquals(error.getDetails(), response.getDetails());
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  // verify that NotFound is returned for nonexistent key
  @Test
  void updateNonexistentKeyFails() throws Exception {
    AppDto appDto = new AppDto("dd", "deployment dashboard");

    MvcResult result = mockMvc.perform(
      put("/api/apps/dd")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isNotFound())
      .andReturn();
  }

  // verify that valid JSON gets accepted, keep the app key
  @Test
  void updateExistingAppSameKeySucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));

    AppDto appDto = new AppDto("dd", "kontrolní linka");

    mockMvc.perform(
      put("/api/apps/dd")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isOk());


    Assertions.assertEquals(appDto.getKey(), app.getKey());
    Assertions.assertEquals(appDto.getName(), app.getName());
    Assertions.assertEquals(Optional.empty(), app.getParent());
    Assertions.assertEquals(Optional.empty(), app.getDeleted());
  }

  // verify that valid JSON gets accepted, change the app key
  @Test
  void updateExistingAppDifferentKeySucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    AppDto appDto = new AppDto("kl", "kontrolní linka");

    mockMvc.perform(
      put("/api/apps/dd")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isOk());

    Assertions.assertEquals(appDto.getKey(), app.getKey());
    Assertions.assertEquals(appDto.getName(), app.getName());
    Assertions.assertEquals(Optional.empty(), app.getParent());
    Assertions.assertEquals(Optional.empty(), app.getDeleted());
  }

  // verify that changing the app key to an existing one gets rejected
  @Test
  void updateDuplicateAppFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"), new App("kl", "kontrolní linka"));
    AppDto appDto = new AppDto("kl", "nekontrolní linka");

    ErrorBody error = ErrorBody.getDefaultDataIntegrityViolationException();
    error.setDetails("App could not be updated: Key 'kl' already exists.");
    error.setPath("/api/apps/dd");

    MvcResult result = mockMvc.perform(
      put("/api/apps/dd")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isConflict())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertEquals(error.getDetails(), response.getDetails());
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  // deleteApp tests
  // TODO otestovat odebrání app, která má deployment

  // verify that deleting a nonexisting key returns NotFound
  @Test
  void deleteNonexistentAppFails() throws Exception {
    mockMvc.perform(
      delete("/api/apps/dd"))
      .andExpect(status().isNotFound());
  }

  // verify that an app is deleted correctly and the key is modified accordingly
  @Test
  void deleteExistingAppSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));

    mockMvc.perform(
      delete("/api/apps/dd"))
      .andExpect(status().isOk());

    Assertions.assertEquals("dd1", app.getKey());
    Assertions.assertTrue(app.getDeleted().isPresent());
  }

  // addAppEnv tests

  // verify that empty Environment JSON gets rejected
  @Test
  void addEmptyEnvJsonFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    EnvironmentDto envDto = new EnvironmentDto();

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();
    error.setPath("/api/apps/dd/envs");

    MvcResult result = mockMvc.perform(
      post("/api/apps/dd/envs")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(envDto)))
    .andDo(print())
    .andExpect(status().isBadRequest())
    .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    String details = response.getDetails();

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertTrue(details.contains("Environment could not be added:"));
    Assertions.assertTrue(details.contains("Name is blank."));
    Assertions.assertTrue(details.contains("App key is blank."));
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
}

  @Test
  void addEnvEmptyAppKeyFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    EnvironmentDto envDto = new EnvironmentDto();
    envDto.setName("prod");

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();
    error.setPath("/api/apps/dd/envs");

    MvcResult result = mockMvc.perform(
      post("/api/apps/dd/envs")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(envDto)))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    String details = response.getDetails();

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertTrue(details.contains("Environment could not be added: App key is blank."));
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  @Test
  void addEnvEmptyNameFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    EnvironmentDto envDto = new EnvironmentDto();
    envDto.setAppKey("dd");

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();
    error.setPath("/api/apps/dd/envs");

    MvcResult result = mockMvc.perform(
      post("/api/apps/dd/envs")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(envDto)))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    String details = response.getDetails();

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertTrue(details.contains("Environment could not be added: Name is blank."));
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  @Test
  void addEnvToNonexistentApp() throws Exception {
    EnvironmentDto envDto = new EnvironmentDto("dd", "test");

    mockMvc.perform(
      post("/api/apps/dd/envs")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(envDto)))
      .andDo(print())
      .andExpect(status().isNotFound());
  }

  @Test
  void addValidEnvSucceeds() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    EnvironmentDto envDto = new EnvironmentDto("dd", "test");

    mockMvc.perform(
      post("/api/apps/dd/envs")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(envDto)))
      .andDo(print())
      .andExpect(status().isCreated())
      .andReturn();

    Optional<App> fetchedApp = appService.get("dd");
    Optional<Environment> fetchedEnv = envService.get("dd", "test");

    Assertions.assertTrue(fetchedApp.isPresent());
    Assertions.assertTrue(fetchedEnv.isPresent());

    App managedApp = entityManager.merge(fetchedApp.get());
    entityManager.refresh(managedApp);

    Assertions.assertFalse(managedApp.getEnvs().isEmpty());
    Assertions.assertEquals(fetchedEnv.get().getApp(), managedApp);
    Assertions.assertEquals(managedApp.getEnvs().getFirst(), fetchedEnv.get());
  }

  @Test
  void addDuplicateEnvFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    EnvironmentDto envDto = new EnvironmentDto("dd", "test");

    String envJson = objectMapper.writeValueAsString(envDto);

    ErrorBody error = ErrorBody.getDefaultDataIntegrityViolationException();
    error.setDetails("Environment could not be added: key 'test' already exists for app 'dd'.");
    error.setPath("/api/apps/dd/envs");

    mockMvc.perform(
      post("/api/apps/dd/envs")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(envJson))
      .andDo(print())
      .andExpect(status().isCreated());

    MvcResult result = mockMvc.perform(
      post("/api/apps/dd/envs")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(envJson))
      .andDo(print())
      .andExpect(status().isConflict())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertEquals(error.getDetails(), response.getDetails());
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  @Test
  void addMultipleEnvsSucceeds() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    EnvironmentDto envDtoTest = new EnvironmentDto("dd", "test");
    EnvironmentDto envDtoProd = new EnvironmentDto("dd", "prod");

    mockMvc.perform(
      post("/api/apps/dd/envs")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(envDtoTest)))
      .andDo(print())
      .andExpect(status().isCreated());

    mockMvc.perform(
      post("/api/apps/dd/envs")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(envDtoProd)))
      .andDo(print())
      .andExpect(status().isCreated());

    Optional<App> fetchedApp = appService.get("dd");
    Optional<Environment> testEnv = envService.get("dd", "test");
    Optional<Environment> prodEnv = envService.get("dd", "prod");

    Assertions.assertTrue(fetchedApp.isPresent());
    Assertions.assertTrue(testEnv.isPresent());
    Assertions.assertTrue(prodEnv.isPresent());

    App managedApp = entityManager.merge(fetchedApp.get());
    entityManager.refresh(managedApp);

    Assertions.assertFalse(managedApp.getEnvs().isEmpty());
    Assertions.assertEquals(testEnv.get().getApp(), managedApp);
    Assertions.assertEquals(prodEnv.get().getApp(), managedApp);
    Assertions.assertTrue(managedApp.getEnvs().contains(testEnv.get()));
    Assertions.assertTrue(managedApp.getEnvs().contains(prodEnv.get()));
  }

  @Test
  void getEnvsSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    List<Environment> envs = List.of(new Environment(app, "test"), new Environment(app, "prod"), new Environment(app, "integ"));
    envService.save(envs);

    Optional<App> fetchedApp = appService.get("dd");

    Assertions.assertTrue(fetchedApp.isPresent());

    app = entityManager.merge(fetchedApp.get());
    entityManager.refresh(app);

    MvcResult result = mockMvc.perform(
      get("/api/apps/dd/envs"))
      .andExpect(status().isOk())
      .andDo(print())
      .andReturn();

    String response = result.getResponse().getContentAsString();

    for (Environment env: envs) {
      Assertions.assertTrue(response.contains(objectMapper.writeValueAsString(env)));
    }
  }

  // updateAppEnv tests

  @Test
  void updateEmptyEnvJsonFails() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.save(new Environment(app, "test"));
    EnvironmentDto envDto = new EnvironmentDto();

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();;
    error.setPath("/api/apps/dd/envs/test");

    MvcResult result = mockMvc.perform(
        put("/api/apps/dd/envs/test")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(envDto)))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andReturn();

    ErrorBody response = objectMapper.readValue(result.getResponse().getContentAsString(), ErrorBody.class);

    String details = response.getDetails();

    Assertions.assertEquals(error.getStatusCode(), response.getStatusCode());
    Assertions.assertEquals(error.getMessage(), response.getMessage());
    Assertions.assertTrue(details.contains("Environment could not be updated:"));
    Assertions.assertTrue(details.contains("Name is blank."));
    Assertions.assertTrue(details.contains("App key is blank."));
    Assertions.assertEquals(error.getPath(), response.getPath());
    Assertions.assertEquals(error.getSuggestion(), response.getSuggestion());
  }

  @Test
  void updateEmptyNameEnvJsonFails() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.save(new Environment(app, "test"));
    EnvironmentDto envDto = new EnvironmentDto();
    envDto.setAppKey("dd");

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();;
    error.setPath("/api/apps/dd/envs/test");
    error.setDetails("Environment could not be updated: Name is blank.");

    MvcResult result = mockMvc.perform(
        put("/api/apps/dd/envs/test")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(envDto)))
      .andDo(print())
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
  void updateEmptyAppKeyEnvJsonFails() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.save(new Environment(app, "test"));
    EnvironmentDto envDto = new EnvironmentDto();
    envDto.setName("prod");

    ErrorBody error = ErrorBody.getDefaultHttpMessageConversionException();;
    error.setPath("/api/apps/dd/envs/test");
    error.setDetails("Environment could not be updated: App key is blank.");

    MvcResult result = mockMvc.perform(
        put("/api/apps/dd/envs/test")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(envDto)))
      .andDo(print())
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
  void updateValidEnvSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.save(new Environment(app, "test"));
    EnvironmentDto envDto = new EnvironmentDto("dd", "prod");

    mockMvc.perform(
      put("/api/apps/dd/envs/test")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(envDto)))
      .andDo(print())
      .andExpect(status().isOk());

    Optional<App> fetchedApp = appService.get("dd");
    Optional<Environment> fetchedEnv = envService.get("dd", "prod");

    Assertions.assertTrue(fetchedApp.isPresent());
    Assertions.assertTrue(fetchedEnv.isPresent());

    app = entityManager.merge(fetchedApp.get());
    entityManager.refresh(app);

    Assertions.assertFalse(envService.exists("dd", "test"));
    Assertions.assertTrue(envService.exists("dd", "prod"));
    Assertions.assertTrue(app.getEnvs().contains(fetchedEnv.get()));
  }

  // deleteAppEnv tests
  // TODO otestovat odebrání env, které má deployment

  @Test
  void deleteNonexistentEnvFails() throws Exception {
    mockMvc.perform(
      delete("/api/apps/dd/envs/test"))
      .andExpect(status().isNotFound());
  }

  @Test
  void deleteExistingEnvSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.save(new Environment(app, "test"));

    mockMvc.perform(
      delete("/api/apps/dd/envs/test"))
      .andExpect(status().isOk());

    Assertions.assertFalse(envService.exists("dd", "test"));
    Assertions.assertTrue(app.getEnvs().isEmpty());
  }
}
