package cz.oksystem.deployment_dashboard;

import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Deployment;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.entity.Version;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions;
import cz.oksystem.deployment_dashboard.service.ServiceOrchestrator;
import jakarta.validation.Valid;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


//API
//Chceme jednoduché klikání při nasazení verze, žádné složité vyplňování. API proto nebude RESTful.
@RestController
@RequestMapping("/api/apps")
class ApiController {
  private final ServiceOrchestrator serviceOrchestrator;

  public ApiController(ServiceOrchestrator serviceOrchestrator) {
    this.serviceOrchestrator = serviceOrchestrator;
  }

  String getBindingResultErrorMessage(BindingResult result) {
    return String.join(" ", result.getAllErrors().stream()
      .map(DefaultMessageSourceResolvable::getDefaultMessage)
      .toList());
  }

  //  nová aplikace - POST /api/apps
  //  kontrolovat duplicity klice aplikace
  @PostMapping(consumes = "application/json")
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
      throw new CustomExceptions.EntityAdditionException(App.class, ex);
    }
  }

  //  update aplikace - PUT /api/apps/:key
  //  kontrolovat duplicity klice aplikace
  @PutMapping("{key}")
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
      throw new CustomExceptions.EntityUpdateException(App.class, ex);
    }
  }

  //  smazat aplikaci - DELETE /api/apps/:key
  //  povolit pouze pokud neexistují žádné aplikační release
  @DeleteMapping("{key}")
  @ResponseStatus(value = HttpStatus.OK)
  void archiveOrDeleteApp(@PathVariable("key") String key,
                          @RequestParam(value = "hard_delete", required = false) boolean hardDelete) {
    try {
      serviceOrchestrator.deleteApp(key, hardDelete);
    } catch (CustomExceptions.NotManagedException
             | CustomExceptions.DeletionNotAllowedException ex) {
      throw new CustomExceptions.EntityDeletionOrArchivationException(App.class, ex);
    }
  }

  //  nová verze - GET /api/apps/:key/envs/:envkey/versions/:version?ticket=:urlencoded_ticket_link:&component=:component_1:&component=:component_2:&components_only=true
  //  pokud neexistuje aplikace, vrací chybu
  //  pokud neexistuje prostředí, vrací chybu
  //  pokud neexistuje verze, vytvoří verzi (toto navíc ovliňuje flag components_only)
  //  pokud neexistuje komponenta, vrací chybu
  //  vytvoří záznam deploymentu k dané verzi a aplikaci / komponentám
  //  components_only - pokud je true, nevytváříme záznam k aplikace, pouze ke komponentám
  //    musí existovat alespoň jedna komponenta
  //
//  @GetMapping("{key}/envs/{envKey}/versions/{version}")
//  @ResponseStatus(value = HttpStatus.OK)
//  void newVersion(@PathVariable("key") String appKey,
//                  @PathVariable("envKey") String envKey,
//                  @PathVariable("version") String versionName,
//                  @RequestParam(value = "ticket", required = false) String jiraTicket,
//                  @RequestParam(value = "component", required = false) List<String> components,
//                  @RequestParam(value = "components_only", required = false) boolean componentsOnly) {
//    try {
//      serviceOrchestrator.release(appKey, components, envKey, versionName, jiraTicket, componentsOnly);
//    } catch (CustomExceptions.NotManagedException
//             | CustomExceptions.NoSuchAppComponentException ex) {
//      throw new CustomExceptions.EntityAdditionException(Deployment.class, ex);
//    }
//  }

  @GetMapping("{key}/envs/{envKey}/versions")
  @ResponseStatus(value = HttpStatus.OK)
  void multipleNewVersions(@PathVariable("key") String appKey,
                           @PathVariable("envKey") String envKey,
                           @RequestParam Map<String, String> versionedApps,
                           @RequestParam(value = "ticket", required = false) String jiraTicket) {
    try {
      serviceOrchestrator.release(appKey, envKey, versionedApps, jiraTicket);
    } catch (CustomExceptions.NotManagedException
             | CustomExceptions.NoSuchAppComponentException ex) {
      throw new CustomExceptions.EntityAdditionException(Deployment.class, ex);
    }
  }

  // TODO vyřešit serializaci cyklů (v deployment listu chceme jméno prostředí)
  // získání všech verzí projektu - GET /api/apps/:key
  @GetMapping("{key}")
  @ResponseStatus(value = HttpStatus.OK)
  ResponseEntity<List<Version>> getAllVersions(@PathVariable("key") String key) {
    try {
      return ResponseEntity.ok(serviceOrchestrator.getAppVersions(key));
    } catch (CustomExceptions.NotManagedException ex) {
      throw new CustomExceptions. EntityFetchException(App.class, ex);
    }
  }

  // TODO vyřešit serializaci cyklů (v deployment listu chceme jméno verze)
  // získání všech prostředí - GET /api/apps/:key/envs
  @GetMapping("{key}/envs")
  @ResponseStatus(value = HttpStatus.OK)
  ResponseEntity<List<Environment>> getAllAppEnvs(@PathVariable("key") String key) {
    try {
      return ResponseEntity.ok(serviceOrchestrator.getAppEnvironments(key));
    } catch (CustomExceptions.NotManagedException ex) {
      throw new CustomExceptions.EntityFetchException(Environment.class, ex);
    }
  }

  //  nové prostředí aplikace - POST /api/apps/:key/envs
  //  zakázat duplicity
  @PostMapping(path = "{key}/envs", consumes = "application/json")
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
      throw new CustomExceptions.EntityAdditionException(Environment.class, ex);
    }
  }

  //  update prostředí aplikace - PUT /api/apps/:key/envs/:envkey
  //  zakázat duplicity
  @PutMapping(path = "{key}/envs/{envKey}", consumes = "application/json")
  @ResponseStatus(value = HttpStatus.OK)
  void updateAppEnv(@PathVariable("key") String appKey,
                    @PathVariable("envKey") String envKey,
                    @Valid @RequestBody EnvironmentDto envDto,
                    BindingResult result) {
    try {
      if (result.hasErrors()) {
        throw new HttpMessageConversionException("Environment could not be updated: " + getBindingResultErrorMessage(result));
      }
      serviceOrchestrator.updateEnvironment(appKey, envKey, envDto);
    } catch (HttpMessageConversionException
             | CustomExceptions.NotManagedException
             | CustomExceptions.DuplicateKeyException ex) {
      throw new CustomExceptions.EntityUpdateException(Environment.class, ex);
    }
  }

  //  delete prostředí aplikace - DELETE /api/apps/:key/envs/:envkey
  //  kontrolovat, že pro prostředí neexistují release, jinak nepovolit smazání
  @DeleteMapping(path = "{key}/envs/{envKey}")
  @ResponseStatus(value = HttpStatus.OK)
  void deleteAppEnv(@PathVariable("key") String appKey,
                    @PathVariable("envKey") String envKey) {
    try {
      serviceOrchestrator.deleteEnvironment(appKey, envKey);
    } catch (CustomExceptions.NotManagedException
             | CustomExceptions.DeletionNotAllowedException ex) {
      throw new CustomExceptions.EntityDeletionOrArchivationException(Environment.class, ex);
    }
  }
}
