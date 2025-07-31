package cz.oksystem.deployment_dashboard;

import cz.oksystem.deployment_dashboard.dto.*;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Deployment;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.entity.Version;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions;
import cz.oksystem.deployment_dashboard.exceptions.CustomResponseBody;
import cz.oksystem.deployment_dashboard.service.ServiceOrchestrator;
import jakarta.validation.Valid;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


//API
//Chceme jednoduché klikání při nasazení verze, žádné složité vyplňování. API proto nebude RESTful.
@RestController
@CrossOrigin(origins = {"http://localhost:3000", "http://deploydash-ui:3000"})
@RequestMapping("/api")
class ApiController {
  private final ServiceOrchestrator serviceOrchestrator;

  public ApiController(ServiceOrchestrator serviceOrchestrator) {
    this.serviceOrchestrator = serviceOrchestrator;
  }

  String getBindingResultErrorMessage(BindingResult result) {
    return "Nepodařilo se zpracovat DTO: " + String.join(" ", result.getAllErrors().stream()
      .map(DefaultMessageSourceResolvable::getDefaultMessage)
      .toList());
  }

  //
  // APPS
  //

  //  nová aplikace - POST /api/apps
  //  kontrolovat duplicity klice aplikace
  @PostMapping(path = "/apps", consumes = "application/json")
  @ResponseStatus(value = HttpStatus.CREATED)
  void addApp(@Valid @RequestBody AppDto appDto,
              BindingResult result) {
    try {
      if (result.hasErrors()) {
        throw new HttpMessageConversionException(getBindingResultErrorMessage(result));
      }
      serviceOrchestrator.addApp(appDto);
    } catch (HttpMessageConversionException
             | CustomExceptions.NotManagedException
             | CustomExceptions.DuplicateKeyException
             | CustomExceptions.RecursiveAppParentingException ex) {
      String appKey = appDto.getKey();

      throw new CustomExceptions.EntityAdditionException(App.CZECH_NAME, appKey == null ? "" : appDto.getKey(), ex);
    }
  }

  //  update aplikace - PUT /api/apps/:key
  //  kontrolovat duplicity klice aplikace
  @PutMapping("/apps/{key}")
  @ResponseStatus(value = HttpStatus.OK)
  void updateApp(@PathVariable("key") String key,
                 @Valid @RequestBody AppDto appDto,
                 BindingResult result) {
    try {
      if (result.hasErrors()) {
        throw new HttpMessageConversionException(getBindingResultErrorMessage(result));
      }
      serviceOrchestrator.updateApp(key, appDto);
    } catch (HttpMessageConversionException
             | CustomExceptions.NotManagedException
             | CustomExceptions.DuplicateKeyException
             | CustomExceptions.RecursiveAppParentingException ex) {
      throw new CustomExceptions.EntityUpdateException(App.CZECH_NAME, key, ex);
    }
  }

  //  smazat aplikaci - DELETE /api/apps/:key
  //  povolit pouze pokud neexistují žádné aplikační release
  @DeleteMapping("/apps/{key}")
  @ResponseStatus(value = HttpStatus.OK)
  void archiveOrDeleteApp(@PathVariable("key") String key,
                          @RequestParam(value = "force", required = false) boolean force) {
    try {
      serviceOrchestrator.deleteApp(key, force);
    } catch (CustomExceptions.NotManagedException
             | CustomExceptions.DeletionNotAllowedException ex) {
      throw new CustomExceptions.EntityDeletionOrArchivationException(App.CZECH_NAME, key, ex);
    }
  }

  // overview vsech aplikaci
  @GetMapping("/apps-overview")
  ResponseEntity<List<ProjectOverviewDto>> getAllProjectOverviews() {
    return ResponseEntity.ok(serviceOrchestrator.getAllProjectOverviews());
  }

  // detailni informace o vsech aplikacich
  @GetMapping(path = "/apps")
  @ResponseStatus(value = HttpStatus.OK)
  ResponseEntity<List<ProjectDetailDto>> getAllAppDetails() {
    return ResponseEntity.ok(serviceOrchestrator.getAllAppDetailDtos());
  }

  // detailni informace o specifikovane aplikaci
  @GetMapping("/apps/{key}")
  @ResponseStatus(value = HttpStatus.OK)
  ResponseEntity<ProjectDetailDto> getAppDetail(@PathVariable("key") String key) {
    try {
      return ResponseEntity.ok(serviceOrchestrator.getAppDetailDto(key));
    } catch (CustomExceptions.NotManagedException ex) {
      throw new CustomExceptions.EntityFetchException("Aplikace", ex);
    }
  }

  // získání všech prostředí - GET /api/apps/:key/envs
  @GetMapping("/apps/{key}/envs")
  @ResponseStatus(value = HttpStatus.OK)
  ResponseEntity<List<Environment>> getAllAppEnvs(@PathVariable("key") String key) {
    try {
      return ResponseEntity.ok(serviceOrchestrator.getAppEnvironments(key));
    } catch (CustomExceptions.NotManagedException ex) {
      throw new CustomExceptions.EntityFetchException(Environment.CZECH_NAME, ex);
    }
  }

  //
  // ENVIRONMENTS
  //

  //  nové prostředí aplikace - POST /api/apps/:key/envs
  //  zakázat duplicity
  @PostMapping(path = "/apps/{key}/envs", consumes = "application/json")
  @ResponseStatus(value = HttpStatus.CREATED)
  void addAppEnv(@PathVariable("key") String appKey,
                 @Valid @RequestBody EnvironmentDto envDto,
                 BindingResult result) {
    try {
      if (result.hasErrors()) {
        throw new HttpMessageConversionException(getBindingResultErrorMessage(result));
      }
      serviceOrchestrator.addEnvironment(envDto);
    } catch (HttpMessageConversionException
             | CustomExceptions.NotManagedException
             | CustomExceptions.DuplicateKeyException ex) {
      String envName = envDto.getName();

      throw new CustomExceptions.EntityAdditionException(Environment.CZECH_NAME, envName == null ? "" : envName, ex);
    }
  }

  //  update prostředí aplikace - PUT /api/apps/:key/envs/:envkey
  //  zakázat duplicity
  @PutMapping(path = "/apps/{key}/envs/{envKey}", consumes = "application/json")
  @ResponseStatus(value = HttpStatus.OK)
  void updateAppEnv(@PathVariable("key") String appKey,
                    @PathVariable("envKey") String envKey,
                    @Valid @RequestBody EnvironmentDto envDto,
                    BindingResult result) {
    try {
      if (result.hasErrors()) {
        throw new HttpMessageConversionException(getBindingResultErrorMessage(result));
      }
      serviceOrchestrator.updateEnvironment(appKey, envKey, envDto);
    } catch (HttpMessageConversionException
             | CustomExceptions.NotManagedException
             | CustomExceptions.DuplicateKeyException ex) {
      throw new CustomExceptions.EntityUpdateException(Environment.CZECH_NAME, envKey, ex);
    }
  }

  //  delete prostředí aplikace - DELETE /api/apps/:key/envs/:envkey
  //  kontrolovat, že pro prostředí neexistují release, jinak nepovolit smazání
  @DeleteMapping(path = "/apps/{key}/envs/{envKey}")
  @ResponseStatus(value = HttpStatus.OK)
  void deleteAppEnv(@PathVariable("key") String appKey,
                    @PathVariable("envKey") String envKey,
                    @RequestParam(value = "force", required = false) boolean force) {
    try {
      serviceOrchestrator.deleteEnvironment(appKey, envKey, force);
    } catch (CustomExceptions.NotManagedException
             | CustomExceptions.DeletionNotAllowedException ex) {
      throw new CustomExceptions.EntityDeletionOrArchivationException(Environment.CZECH_NAME, envKey, ex);
    }
  }

  //
  // VERSIONS
  //

  // update verze
  @PutMapping(path = "/apps/{appKey}/versions/{versionName}", consumes = "application/json")
  @ResponseStatus(value = HttpStatus.OK)
  void updateVersion(@PathVariable("appKey") String appKey,
                     @PathVariable("versionName") String versionName,
                     @Valid @RequestBody VersionDto versionDto,
                     BindingResult result) {
    try {
      if (result.hasErrors()) {
        throw new HttpMessageConversionException(getBindingResultErrorMessage(result));
      }
      serviceOrchestrator.updateVersion(appKey, versionName, versionDto);
    } catch (HttpMessageConversionException
             | CustomExceptions.NotManagedException
             | CustomExceptions.DuplicateKeyException ex) {
      throw new CustomExceptions.EntityUpdateException(Version.CZECH_NAME, versionName, ex);
    }
  }

  //
  // DEPLOYMENTS
  //

  // bezne zaevidovani nove verze
  @GetMapping("/apps/{key}/envs/{envKey}/versions")
  ResponseEntity<CustomResponseBody> multipleNewVersions(@PathVariable("key") String appKey,
                                             @PathVariable("envKey") String envKey,
                                             @RequestParam Map<String, String> parameters) {
    return doMultipleNewVersions(appKey, envKey, parameters, false);
  }

  // vynucene zaevidovani v pripade konfliktu
  @GetMapping("/force/apps/{key}/envs/{envKey}/versions")
  ResponseEntity<CustomResponseBody> multipleNewVersionsForce(@PathVariable("key") String appKey,
                                                               @PathVariable("envKey") String envKey,
                                                               @RequestParam Map<String, String> parameters) {
    return doMultipleNewVersions(appKey, envKey, parameters, true);
  }

  private ResponseEntity<CustomResponseBody> doMultipleNewVersions(String appKey, String envKey, Map<String, String> parameters, boolean force) {
    try {
      String ticketUuid = parameters.get("ticket");

      HashMap<String, String> versionedApps = new HashMap<>(parameters);
      versionedApps.remove("ticket");

      serviceOrchestrator.release(appKey, envKey, versionedApps, ticketUuid, force);
      return ResponseEntity.ok(new CustomResponseBody(HttpStatus.OK, "Nasazení úspěšně zaevidováno."));
    } catch (CustomExceptions.NotManagedException
             | CustomExceptions.NoSuchAppComponentException
             | CustomExceptions.VersionRedeployException
             | CustomExceptions.VersionRollbackException ex) {
      throw new CustomExceptions.DeploymentEvidenceException(ex);
    }
  }

  @GetMapping(path = "/deployments")
  @ResponseStatus(value = HttpStatus.OK)
  ResponseEntity<List<DeploymentDto>> getAllDeployments() {
    return ResponseEntity.ok(serviceOrchestrator.getAllDeployments());
  }

  @DeleteMapping(path = "/apps/{appKey}/envs/{envKey}/versions/{versionName}/deployment")
  @ResponseStatus(value = HttpStatus.OK)
  void deleteDeployment(@PathVariable("appKey") String appKey,
                        @PathVariable("envKey") String envKey,
                        @PathVariable("versionName") String versionName) {
    try {
      serviceOrchestrator.deleteDeployment(appKey, envKey, versionName);
    } catch (CustomExceptions.NotManagedException
             | CustomExceptions.DeletionNotAllowedException ex) {
      throw new CustomExceptions.EntityDeletionOrArchivationException(Deployment.CZECH_NAME, "", ex);
    }
  }
}
