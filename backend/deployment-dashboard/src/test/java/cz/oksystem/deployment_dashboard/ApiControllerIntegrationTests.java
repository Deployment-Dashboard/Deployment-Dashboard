package cz.oksystem.deployment_dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


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
    appService.resetArchivationCounter();
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

    mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto))
        .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.BAD_REQUEST.value()))
      .andExpect(jsonPath("$.message").value("App could not be added."))
      .andExpect(jsonPath("$.details").value(containsString("Key is blank.")))
      .andExpect(jsonPath("$.details").value(containsString("Name is blank")))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps"));
  }

  // verify that empty key field get rejected
  @Test
  void addEmptyKeyFails() throws Exception {
    AppDto appDto = new AppDto();
    appDto.setName("deployment dashboard");

    mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto))
        .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.BAD_REQUEST.value()))
      .andExpect(jsonPath("$.message").value("App could not be added."))
      .andExpect(jsonPath("$.details").value("Key is blank."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps"));
  }

  // verify that empty name field gets rejected
  @Test
  void addEmptyNameFails() throws Exception {
    AppDto appDto = new AppDto();
    appDto.setKey("dd");

    mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto))
        .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.BAD_REQUEST.value()))
      .andExpect(jsonPath("$.message").value("App could not be added."))
      .andExpect(jsonPath("$.details").value("Name is blank."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps"));
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
    Assertions.assertEquals(Optional.empty(), app.getArchivedTimestamp());
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
    Assertions.assertTrue(app.getComponents().contains(fe.get()));
    Assertions.assertTrue(app.getComponents().contains(db.get()));
  }

  // verify that an app that is a parent of itself gets rejected
  @Test
  void addRecursiveAppFails() throws Exception {
    AppDto appDto = new AppDto("dd", "deployment dashboard", "dd");

    MvcResult result = mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isConflict())
      .andReturn();

    mockMvc.perform(
        post("/api/apps")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(appDto))
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isConflict())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.CONFLICT.value()))
      .andExpect(jsonPath("$.message").value("App could not be added."))
      .andExpect(jsonPath("$.details").value("App cannot be a parent of itself."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps"));
  }

  // verify that a duplicate app is rejected
  @Test
  void addDuplicateAppFails() throws Exception {
    AppDto appDto = new AppDto("dd", "deployment dashboard");
    String appJson = objectMapper.writeValueAsString(appDto);

    mockMvc.perform(
      post("/api/apps")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(appJson))
      .andDo(print())
      .andExpect(status().isCreated());

    mockMvc.perform(
        post("/api/apps")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(appJson)
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isConflict())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.CONFLICT.value()))
      .andExpect(jsonPath("$.message").value("App could not be added."))
      .andExpect(jsonPath("$.details").value("App with key 'dd' already exists."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps"));
  }

  // updateApp tests

  // verify that empty JSON gets rejected
  @Test
  void updateEmptyJsonFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    AppDto appDto = new AppDto();

    mockMvc.perform(
        put("/api/apps/dd")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(appDto))
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.BAD_REQUEST.value()))
      .andExpect(jsonPath("$.message").value("App could not be updated."))
      .andExpect(jsonPath("$.details").value(containsString("Key is blank.")))
      .andExpect(jsonPath("$.details").value(containsString("Name is blank")))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd"));
  }

  // verify that empty key field gets rejected
  @Test
  void updateEmptyKeyFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    AppDto appDto = new AppDto();
    appDto.setName("deployment dashboard");

    mockMvc.perform(
        put("/api/apps/dd")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(appDto))
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.BAD_REQUEST.value()))
      .andExpect(jsonPath("$.message").value("App could not be updated."))
      .andExpect(jsonPath("$.details").value("Key is blank."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd"));
  }

  // verify that empty name field gets rejected
  @Test
  void updateEmptyNameFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    AppDto appDto = new AppDto();
    appDto.setKey("dd");

    mockMvc.perform(
        put("/api/apps/dd")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(appDto))
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.BAD_REQUEST.value()))
      .andExpect(jsonPath("$.message").value("App could not be updated."))
      .andExpect(jsonPath("$.details").value("Name is blank."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd"));
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
    Assertions.assertEquals(Optional.empty(), app.getArchivedTimestamp());
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
    Assertions.assertEquals(Optional.empty(), app.getArchivedTimestamp());
  }

  // verify that changing the app key to an existing one gets rejected
  @Test
  void updateDuplicateAppFails() throws Exception {
    appService.saveAll(new App("dd", "deployment dashboard"), new App("kl", "kontrolní linka"));
    AppDto appDto = new AppDto("kl", "nekontrolní linka");

    mockMvc.perform(
        put("/api/apps/dd")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(appDto))
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isConflict())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.CONFLICT.value()))
      .andExpect(jsonPath("$.message").value("App could not be updated."))
      .andExpect(jsonPath("$.details").value("App with key 'kl' already exists."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd"));
  }

  // deleteApp tests

  // verify that deleting a nonexisting key returns NotFound
  @Test
  void deleteNonexistentAppFails() throws Exception {
    mockMvc.perform(
        delete("/api/apps/dd")
          .characterEncoding("utf-8")
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isNotFound())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.NOT_FOUND.value()))
      .andExpect(jsonPath("$.message").value("App could not be archived/deleted."))
      .andExpect(jsonPath("$.details").value("App with key 'dd' is not managed."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd"));
  }

  // verify that an app is deleted
  @Test
  void deleteExistingAppSucceeds() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));

    mockMvc.perform(
      delete("/api/apps/dd?hard_delete=true"))
      .andExpect(status().isOk());

    Assertions.assertFalse(appService.exists("dd"));
  }

  @Test
  void archiveExistingAppSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));

    mockMvc.perform(
      delete("/api/apps/dd"))
      .andExpect(status().isOk());

    entityManager.flush();
    entityManager.refresh(app);

    Assertions.assertEquals("dd (archiv #1)", app.getKey());
    Assertions.assertTrue(app.getArchivedTimestamp().isPresent());
  }

  @Test
  void deleteAppWithDeploymentFails() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.save(new Environment(app, "test"));

    mockMvc.perform(
        get("/api/apps/dd/envs/test/versions/1-0"))
      .andDo(print())
      .andExpect(status().isOk());

    entityManager.flush();
    entityManager.refresh(app);

    Assertions.assertTrue(app.hasDeployment());

    mockMvc.perform(
        delete("/api/apps/dd?hard_delete=true"))
      .andExpect(status().isConflict())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.CONFLICT.value()))
      .andExpect(jsonPath("$.message").value("App could not be archived/deleted."))
      .andExpect(jsonPath("$.details").value("App has deployments!"))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd"));
  }
  // addAppEnv tests

  // verify that empty Environment JSON gets rejected
  @Test
  void addEmptyEnvJsonFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    EnvironmentDto envDto = new EnvironmentDto();

    mockMvc.perform(
        post("/api/apps/dd/envs")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(envDto))
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.BAD_REQUEST.value()))
      .andExpect(jsonPath("$.message").value("Environment could not be added."))
      .andExpect(jsonPath("$.details").value(containsString("Name is blank.")))
      .andExpect(jsonPath("$.details").value(containsString("App key is blank.")))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd/envs"));
}

  @Test
  void addEnvEmptyAppKeyFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    EnvironmentDto envDto = new EnvironmentDto();
    envDto.setName("prod");

    mockMvc.perform(
        post("/api/apps/dd/envs")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(envDto))
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.BAD_REQUEST.value()))
      .andExpect(jsonPath("$.message").value("Environment could not be added."))
      .andExpect(jsonPath("$.details").value(containsString("App key is blank.")))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd/envs"));
  }

  @Test
  void addEnvEmptyNameFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    EnvironmentDto envDto = new EnvironmentDto();
    envDto.setAppKey("dd");

    mockMvc.perform(
        post("/api/apps/dd/envs")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(envDto))
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.BAD_REQUEST.value()))
      .andExpect(jsonPath("$.message").value("Environment could not be added."))
      .andExpect(jsonPath("$.details").value(containsString("Name is blank.")))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd/envs"));
  }

  @Test
  void addEnvToNonexistentApp() throws Exception {
    EnvironmentDto envDto = new EnvironmentDto("dd", "test");

    mockMvc.perform(
      post("/api/apps/dd/envs")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(envDto))
        .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isNotFound())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.NOT_FOUND.value()))
      .andExpect(jsonPath("$.message").value("Environment could not be added."))
      .andExpect(jsonPath("$.details").value("App with key 'dd' is not managed."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd/envs"));
  }

  @Test
  void addValidEnvSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
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

    entityManager.flush();
    entityManager.refresh(app);

    Assertions.assertFalse(app.getEnvs().isEmpty());
    Assertions.assertEquals(fetchedEnv.get().getApp(), app);
    Assertions.assertEquals(app.getEnvs().getFirst(), fetchedEnv.get());
  }

  @Test
  void addDuplicateEnvFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    EnvironmentDto envDto = new EnvironmentDto("dd", "test");
    String envJson = objectMapper.writeValueAsString(envDto);


    mockMvc.perform(
      post("/api/apps/dd/envs")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(envJson))
      .andDo(print())
      .andExpect(status().isCreated());

    mockMvc.perform(
        post("/api/apps/dd/envs")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(envJson)
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isConflict())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.CONFLICT.value()))
      .andExpect(jsonPath("$.message").value("Environment could not be added."))
      .andExpect(jsonPath("$.details").value("Environment with key 'dd-test' already exists."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd/envs"));
  }

  @Test
  void addMultipleEnvsSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
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

    Optional<Environment> testEnv = envService.get("dd", "test");
    Optional<Environment> prodEnv = envService.get("dd", "prod");

    Assertions.assertTrue(testEnv.isPresent());
    Assertions.assertTrue(prodEnv.isPresent());

    entityManager.flush();
    entityManager.refresh(app);

    Assertions.assertFalse(app.getEnvs().isEmpty());
    Assertions.assertEquals(testEnv.get().getApp(), app);
    Assertions.assertEquals(prodEnv.get().getApp(), app);
    Assertions.assertTrue(app.getEnvs().contains(testEnv.get()));
    Assertions.assertTrue(app.getEnvs().contains(prodEnv.get()));
  }

  @Test
  void getEnvsSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    List<Environment> envs = envService.saveAll(new Environment(app, "test"), new Environment(app, "prod"), new Environment(app, "integ"), new Environment(app, "mpsv-prod"));

    entityManager.flush();
    entityManager.refresh(app);

    envs.forEach(env -> Assertions.assertTrue(app.getEnvs().contains(env)));

    MvcResult result = mockMvc.perform(
      get("/api/apps/dd/envs")
        .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isOk())
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

    mockMvc.perform(
        put("/api/apps/dd/envs/test")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(envDto))
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.BAD_REQUEST.value()))
      .andExpect(jsonPath("$.message").value("Environment could not be updated."))
      .andExpect(jsonPath("$.details").value(containsString("App key is blank.")))
      .andExpect(jsonPath("$.details").value(containsString("Name is blank")))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd/envs/test"));
  }

  @Test
  void updateEmptyNameEnvJsonFails() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.save(new Environment(app, "test"));
    EnvironmentDto envDto = new EnvironmentDto();
    envDto.setAppKey("dd");

    mockMvc.perform(
        put("/api/apps/dd/envs/test")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(envDto))
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.BAD_REQUEST.value()))
      .andExpect(jsonPath("$.message").value("Environment could not be updated."))
      .andExpect(jsonPath("$.details").value(containsString("Name is blank")))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd/envs/test"));
  }

  @Test
  void updateEmptyAppKeyEnvJsonFails() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.save(new Environment(app, "test"));
    EnvironmentDto envDto = new EnvironmentDto();
    envDto.setName("prod");

    mockMvc.perform(
        put("/api/apps/dd/envs/test")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(envDto))
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.BAD_REQUEST.value()))
      .andExpect(jsonPath("$.message").value("Environment could not be updated."))
      .andExpect(jsonPath("$.details").value(containsString("App key is blank")))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd/envs/test"));
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

    entityManager.flush();
    entityManager.refresh(app);

    Assertions.assertFalse(envService.exists("dd", "test"));
    Assertions.assertTrue(envService.exists("dd", "prod"));
    Assertions.assertTrue(app.getEnvs().contains(fetchedEnv.get()));
  }

  // deleteAppEnv tests

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

  @Test
  void deleteEnvWithDeploymentFails() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.save(new Environment(app, "test"));

    mockMvc.perform(
        get("/api/apps/dd/envs/test/versions/1-0"))
      .andDo(print())
      .andExpect(status().isOk());

      entityManager.flush();
      entityManager.refresh(app);

      Assertions.assertTrue(app.hasDeployment());

      mockMvc.perform(
          delete("/api/apps/dd/envs/test"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.statusCode").value(HttpStatus.CONFLICT.value()))
        .andExpect(jsonPath("$.message").value("Environment could not be archived/deleted."))
        .andExpect(jsonPath("$.details").value("Environment has deployments!"))
        .andExpect(jsonPath("$.timestamp").isNotEmpty())
        .andExpect(jsonPath("$.path").value("/api/apps/dd/envs/test"));
  }

  // newVersion tests

}
