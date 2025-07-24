package cz.oksystem.deployment_dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.entity.Version;
import cz.oksystem.deployment_dashboard.service.AppService;
import cz.oksystem.deployment_dashboard.service.DeploymentService;
import cz.oksystem.deployment_dashboard.service.EnvironmentService;
import cz.oksystem.deployment_dashboard.service.VersionService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
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
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
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
  private EntityManager em;


	@Test
	void contextLoads() throws Exception {
    Assertions.assertNotNull(objectMapper);
    Assertions.assertNotNull(mockMvc);
    Assertions.assertNotNull(apiController);
    Assertions.assertNotNull(appService);
    Assertions.assertNotNull(envService);
    Assertions.assertNotNull(verService);
    Assertions.assertNotNull(depService);
    Assertions.assertNotNull(em);
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
    Assertions.assertEquals(component.get(), app.getDirectComponents().getFirst());
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

    em.flush();
    em.clear();

    app = appService.get(app.getKey()).orElse(null);

    Optional<App> fe = appService.get("dd-fe");
    Optional<App> db = appService.get("dd-db");

    Assertions.assertNotNull(app);
    Assertions.assertTrue(fe.isPresent());
    Assertions.assertTrue(db.isPresent());
    Assertions.assertFalse(app.getComponents().isEmpty());
    Assertions.assertTrue(app.getDirectComponents().contains(fe.get()));
    Assertions.assertTrue(app.getDirectComponents().contains(db.get()));
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

    mockMvc.perform(
      put("/api/apps/dd")
        .characterEncoding("utf-8")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(appDto)))
      .andDo(print())
      .andExpect(status().isNotFound());
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

  @Test
  void updateMakeRecursiveAppFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));
    AppDto appDto = new AppDto("dd", "deployment dashboard", "dd");

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
      .andExpect(jsonPath("$.details").value("App to app relationship forms a circle."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd"));
  }

  @Test
  void makeDeeperRecursiveAppFails() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    appService.save(new App("test", "intermediate", app));
    AppDto appDto = new AppDto("dd", "deployment dashboard", "test");

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
      .andExpect(jsonPath("$.details").value("App to app relationship forms a circle."))
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

//  @Test
//  void archiveExistingAppSucceeds() throws Exception {
//    App app = appService.save(new App("dd", "deployment dashboard"));
//
//    mockMvc.perform(
//      delete("/api/apps/dd"))
//      .andExpect(status().isOk());
//
//    Assertions.assertTrue(app.getArchivedTimestamp().isPresent());
//  }

  @Test
  void forceDeleteAppWithDeploymentSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.save(new Environment("test", app));

    mockMvc.perform(
        get("/api/apps/dd/envs/test/versions?dd=1-0"))
      .andDo(print())
      .andExpect(status().isOk());

    Assertions.assertTrue(app.hasDeployment());

    mockMvc.perform(
        delete("/api/apps/dd?hard_delete=true"))
      .andExpect(status().isOk());

    Assertions.assertFalse(appService.exists(app));
  }

  @Test
  void deleteAppWithDeploymentFails() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.save(new Environment("test", app));

    mockMvc.perform(
        get("/api/apps/dd/envs/test/versions?dd=1-0"))
      .andDo(print())
      .andExpect(status().isOk());

    Assertions.assertTrue(app.hasDeployment());

    mockMvc.perform(
        delete("/api/apps/dd"))
      .andExpect(status().isConflict())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.CONFLICT.value()))
      .andExpect(jsonPath("$.message").value("App could not be archived/deleted."))
      .andExpect(jsonPath("$.details").value("App with key 'dd' has deployments."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd"));

    Assertions.assertTrue(appService.exists(app));
    Assertions.assertTrue(app.hasDeployment());
    Assertions.assertFalse(app.getVersions().isEmpty());
    Assertions.assertFalse(app.getEnvironments().isEmpty());
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

    Assertions.assertFalse(app.getEnvironments().isEmpty());
    Assertions.assertEquals(fetchedEnv.get().getApp(), app);
    Assertions.assertEquals(app.getEnvironments().getFirst(), fetchedEnv.get());
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
      .andExpect(jsonPath("$.details").value("Environment with key 'test' for App 'dd' already exists."))
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

    Assertions.assertFalse(app.getEnvironments().isEmpty());
    Assertions.assertEquals(testEnv.get().getApp(), app);
    Assertions.assertEquals(prodEnv.get().getApp(), app);
    Assertions.assertTrue(app.getEnvironments().contains(testEnv.get()));
    Assertions.assertTrue(app.getEnvironments().contains(prodEnv.get()));
  }

  @Test
  void getEnvironmentsSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    List<Environment> envs = envService.saveAll(new Environment("test", app), new Environment("prod", app), new Environment("integ", app), new Environment("mpsv-prod", app));

    envs.forEach(env -> Assertions.assertTrue(app.getEnvironments().contains(env)));

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
    envService.save(new Environment("test", app));
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
    envService.save(new Environment("test", app));
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
    envService.save(new Environment("test", app));
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
  void updateDuplicateEnvFails() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.saveAll(new Environment("test", app), new Environment("prod", app));

    EnvironmentDto envDto = new EnvironmentDto("dd", "prod");

    mockMvc.perform(
        put("/api/apps/dd/envs/test")
          .characterEncoding("utf-8")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(envDto))
          .accept(MediaType.APPLICATION_JSON))
      .andDo(print())
      .andExpect(status().isConflict())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.CONFLICT.value()))
      .andExpect(jsonPath("$.message").value("Environment could not be updated."))
      .andExpect(jsonPath("$.details").value("Environment with key 'prod' for App 'dd' already exists."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd/envs/test"));
  }

  @Test
  void updateValidEnvSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.save(new Environment("test", app));
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

    Assertions.assertFalse(envService.exists("dd", "test"));
    Assertions.assertTrue(envService.exists("dd", "prod"));
    Assertions.assertTrue(app.getEnvironments().contains(fetchedEnv.get()));
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
    envService.save(new Environment("test", app));

    mockMvc.perform(
      delete("/api/apps/dd/envs/test"))
      .andExpect(status().isOk());

    Assertions.assertFalse(envService.exists("dd", "test"));
    Assertions.assertTrue(app.getEnvironments().isEmpty());
  }

  @Test
  void deleteEnvWithDeploymentFails() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    envService.save(new Environment("test", app));

    mockMvc.perform(
        get("/api/apps/dd/envs/test/versions?dd=1-0"))
      .andDo(print())
      .andExpect(status().isOk());

    Assertions.assertTrue(app.hasDeployment());

    mockMvc.perform(
        delete("/api/apps/dd/envs/test"))
      .andExpect(status().isConflict())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.CONFLICT.value()))
      .andExpect(jsonPath("$.message").value("Environment could not be archived/deleted."))
      .andExpect(jsonPath("$.details").value("Environment with key 'test' has deployments."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd/envs/test"));
  }

  // newVersion tests

  @Test
  void deployNonexistentAppFails() throws Exception {
    mockMvc.perform(
      get("/api/apps/dd/envs/test/versions?dd=1-0"))
      .andExpect(status().isNotFound())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.NOT_FOUND.value()))
      .andExpect(jsonPath("$.message").value("Deployment could not be added."))
      .andExpect(jsonPath("$.details").value("App with key 'dd' is not managed."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd/envs/test/versions"));
  }

  @Test
  void deployNonexistendEnvFails() throws Exception {
    appService.save(new App("dd", "deployment dashboard"));

    mockMvc.perform(
        get("/api/apps/dd/envs/test/versions?dd=1-0"))
      .andExpect(status().isNotFound())
      .andExpect(jsonPath("$.statusCode").value(HttpStatus.NOT_FOUND.value()))
      .andExpect(jsonPath("$.message").value("Deployment could not be added."))
      .andExpect(jsonPath("$.details").value("Environment with key 'dd-test' is not managed."))
      .andExpect(jsonPath("$.timestamp").isNotEmpty())
      .andExpect(jsonPath("$.path").value("/api/apps/dd/envs/test/versions"));
  }

  @Test
  void deployValidVersionSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    Environment env = envService.save(new Environment("test", app));

    mockMvc.perform(
        get("/api/apps/dd/envs/test/versions?dd=1-0"))
      .andExpect(status().isOk());

    Optional<Version> fetchedVersion = verService.get(app.getKey(), "1-0");

    Assertions.assertTrue(fetchedVersion.isPresent());

    Version version = fetchedVersion.get();

    Assertions.assertEquals(app, version.getApp());
    Assertions.assertEquals("1-0", version.getName());
    Assertions.assertFalse(app.getVersions().isEmpty());
    Assertions.assertFalse(version.getDeployments().isEmpty());
    Assertions.assertFalse(env.getDeployments().isEmpty());
    Assertions.assertEquals(version.getDeployments().getFirst(), env.getDeployments().getFirst());
  }

  @Test
  void deployValidVersionWithComponentSucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    App component = appService.save(new App("dd-fe", "front end", app));
    Environment env = envService.save(new Environment("test", app));

    mockMvc.perform(
        get("/api/apps/dd/envs/test/versions?dd=1-0&dd-fe=1-0"))
      .andExpect(status().isOk());

    Optional<Version> fetchedVersion = verService.get(app.getKey(), "1-0");
    Assertions.assertTrue(fetchedVersion.isPresent());

    Version version = fetchedVersion.get();

    Assertions.assertEquals(app, version.getApp());
    Assertions.assertEquals("1-0", version.getName());
    Assertions.assertFalse(app.getVersions().isEmpty());
    Assertions.assertFalse(version.getDeployments().isEmpty());
    Assertions.assertFalse(env.getDeployments().isEmpty());
    Assertions.assertEquals(version.getDeployments().getFirst(), env.getDeployments().getFirst());


    Optional<Version> componentFetchedVersion = verService.get(component.getKey(), "1-0");
    Assertions.assertTrue(componentFetchedVersion.isPresent());

    Version componentVersion = componentFetchedVersion.get();

    Assertions.assertEquals(component, componentVersion.getApp());
    Assertions.assertEquals("1-0", componentVersion.getName());
    Assertions.assertFalse(component.getVersions().isEmpty());
    Assertions.assertFalse(componentVersion.getDeployments().isEmpty());
    Assertions.assertFalse(env.getDeployments().isEmpty());
    Assertions.assertEquals(componentVersion.getDeployments().getFirst(), env.getDeployments().get(1));
  }

  @Test
  void deployValidVersionComponentOnlySucceeds() throws Exception {
    App app = appService.save(new App("dd", "deployment dashboard"));
    App component = appService.save(new App("dd-fe", "front end", app));
    Environment env = envService.save(new Environment("test", app));

    mockMvc.perform(
        get("/api/apps/dd/envs/test/versions?dd-fe=1-0"))
      .andExpect(status().isOk());

    Optional<Version> fetchedVersion = verService.get(app.getKey(), "1-0");
    Assertions.assertTrue(fetchedVersion.isEmpty());


    Optional<Version> componentFetchedVersion = verService.get(component.getKey(), "1-0");
    Assertions.assertTrue(componentFetchedVersion.isPresent());

    Version componentVersion = componentFetchedVersion.get();

    Assertions.assertEquals(component, componentVersion.getApp());
    Assertions.assertEquals("1-0", componentVersion.getName());
    Assertions.assertFalse(component.getVersions().isEmpty());
    Assertions.assertFalse(componentVersion.getDeployments().isEmpty());
    Assertions.assertFalse(env.getDeployments().isEmpty());
    Assertions.assertEquals(componentVersion.getDeployments().getFirst(), env.getDeployments().getFirst());
  }
}
