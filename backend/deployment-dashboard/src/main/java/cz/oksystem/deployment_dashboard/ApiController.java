package cz.oksystem.deployment_dashboard;

import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.entity.Version;
import cz.oksystem.deployment_dashboard.serviceAndRepository.AppService;
import cz.oksystem.deployment_dashboard.serviceAndRepository.EnvironmentService;
import jakarta.validation.Valid;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;


//API
//Chceme jednoduché klikání při nasazení verze, žádné složité vyplňování. API proto nebude RESTful.
@RestController
@RequestMapping("/api/apps")
class ApiController {
  private final AppService as;
  private final EnvironmentService es;

  public ApiController(AppService as, EnvironmentService es) {
    this.as = as;
    this.es = es;
  }

  String getBindingResultErrorMessage(BindingResult result) {
    return String.join(" ", result.getAllErrors().stream()
      .map(DefaultMessageSourceResolvable::getDefaultMessage)
      .toList());
  }

  // DONE TESTED
  //  nová aplikace - POST /api/apps
  //  kontrolovat duplicity klice aplikace
  @PostMapping(consumes = "application/json")
  @ResponseStatus(value = HttpStatus.CREATED)
  void addApp(@Valid @RequestBody AppDto appDto,
              BindingResult result) throws HttpMessageConversionException, DataIntegrityViolationException, NotFoundException {
    if (result.hasErrors()) {
      throw new HttpMessageConversionException("App could not be added: " + getBindingResultErrorMessage(result));
    }
    if (as.exists(appDto.getKey())) {
      throw new DataIntegrityViolationException(String.format("App could not be added: key '%s' already exists.", appDto.getKey()));
    }
    if (appDto.getParent().isPresent() && appDto.getParent().get().equals(appDto.getKey())) {
      throw new DataIntegrityViolationException("App could not be added: App cannot be a parent of itself.");
    }
    as.save(as.entityFromDto(appDto));
  }

  // DONE TESTED
  //  update aplikace - PUT /api/apps/:key
  //  kontrolovat duplicity klice aplikace
  @PutMapping("{key}")
  @ResponseStatus(value = HttpStatus.OK)
  void updateApp(@PathVariable("key") String key,
                 @Valid @RequestBody AppDto appDto,
                 BindingResult result) throws HttpMessageConversionException, DataIntegrityViolationException, NotFoundException {
    if (result.hasErrors()) {
      throw new HttpMessageConversionException("App could not be updated: " + getBindingResultErrorMessage(result));
    }

    Optional<App> fetchedApp = as.get(key);

    if (fetchedApp.isPresent()) {
      String parentKey = appDto.getParent().isPresent() ? appDto.getParent().get() : "";

      Optional<App> parentApp =  as.get(parentKey);

      if (parentApp.isEmpty() && !parentKey.isEmpty()) {
        throw new NotFoundException();
      }

      App appToUpdate = fetchedApp.get();

      if (!appToUpdate.getKey().equals(appDto.getKey()) && as.exists(appDto.getKey())) {
        throw new DataIntegrityViolationException(String.format("App could not be updated: Key '%s' already exists.", appDto.getKey()));
      }

      appToUpdate.setKey(appDto.getKey());
      appToUpdate.setName(appDto.getName());


      appToUpdate.setParent(parentApp.isPresent() ? parentApp.get() : null);

      if (appDto.getDeleted().isPresent()) {
        as.delete(appToUpdate);
      }
    } else {
      throw new NotFoundException();
    }
  }

  // DONE - TODO test smazání, pokud je release
  //  smazat aplikaci - DELETE /api/apps/:key
  //  povolit pouze pokud neexistují žádné aplikační release
  @DeleteMapping("{key}")
  @ResponseStatus(value = HttpStatus.OK)
  void deleteApp(@PathVariable("key") String key) throws NotFoundException, DataIntegrityViolationException {
    Optional<App> fetchedApp = as.get(key);

    if (fetchedApp.isPresent()) {
      App appToDelete = fetchedApp.get();

      if (appToDelete.hasRelease()) {
        throw new DataIntegrityViolationException("App could not be deleted: App has releases.");
      }
      as.delete(appToDelete);
    } else {
      throw new NotFoundException();
    }
  }

  //  TODO
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
//                  @PathVariable("version") String version,
//                  @RequestParam("ticket") String urlEncodedTicket,
//                  @RequestParam("component") List<String> components,
//                  @RequestParam("components_only") boolean componentsOnly) throws NotFoundException {
//    Optional<App> appForRelease = as.getByKeyEvenDeleted(appKey);
//
//    if (appForRelease.isEmpty()) {
//      throw new NotFoundException();
//    }
//
//    Optional<Environment> envForRelease = es.findByNameAndApp(envKey, appForRelease);
//
//    if (envForRelease.isEmpty()) {
//      throw new NotFoundException();
//    }
//
//    Version newVersion = new Version();
//  }

  //  získání všech verzí projektu - GET /api/apps/:key
  @GetMapping("{key}")
  @ResponseStatus(value = HttpStatus.OK)
  ResponseEntity<List<Version>> getAllVersions(@PathVariable("key") String key) throws NotFoundException {
    Optional<App> fetched = as.get(key);

    if (fetched.isPresent()) {
      App app = fetched.get();

      return ResponseEntity.ok(app.getVersions());
    } else {
      throw new NotFoundException();
    }
  }

  // DONE TESTED
  //  získání všech prostředí - GET /api/apps/:key/envs
  @GetMapping("{key}/envs")
  @ResponseStatus(value = HttpStatus.OK)
  ResponseEntity<List<Environment>> getAllAppEnvs(@PathVariable("key") String key) throws NotFoundException {
    Optional<App> fetched = as.get(key);

    if (fetched.isPresent()) {
      App app = fetched.get();

      return ResponseEntity.ok(app.getEnvs());
    } else {
      throw new NotFoundException();
    }
  }

  // DONE TESTED
  //  nové prostředí aplikace - POST /api/apps/:key/envs
  //  zakázat duplicity
  @PostMapping(path = "{key}/envs", consumes = "application/json")
  @ResponseStatus(value = HttpStatus.CREATED)
  void addAppEnv(@PathVariable("key") String appKey,
                 @Valid @RequestBody EnvironmentDto envDto,
                 BindingResult result) throws HttpMessageConversionException, DataIntegrityViolationException, NotFoundException {
    if (result.hasErrors()) {
      throw new HttpMessageConversionException("Environment could not be added: " + getBindingResultErrorMessage(result));
    }
    if (es.exists(envDto.getAppKey(), envDto.getName())) {
      throw new DataIntegrityViolationException(String.format("Environment could not be added: key '%s' already exists for app '%s'.", envDto.getName(), envDto.getAppKey()));
    }
    es.save(es.entityFromDto(envDto));
  }

  // DONE TESTED
  //  update prostředí aplikace - PUT /api/apps/:key/envs/:envkey
  //  zakázat duplicity
  @PutMapping(path = "{key}/envs/{envKey}", consumes = "application/json")
  @ResponseStatus(value = HttpStatus.OK)
  void updateAppEnv(@PathVariable("key") String appKey,
                    @PathVariable("envKey") String envKey,
                    @Valid @RequestBody EnvironmentDto envDto,
                    BindingResult result) throws HttpMessageConversionException, DataIntegrityViolationException, NotFoundException {
    if (result.hasErrors()) {
      throw new HttpMessageConversionException("Environment could not be updated: " + getBindingResultErrorMessage(result));
    }

    Optional<Environment> fetchedEnv = es.get(appKey, envKey);

    if (fetchedEnv.isPresent()) {
      Environment envToUpdate = fetchedEnv.get();

      Optional<App> fetchedApp = as.get(envDto.getAppKey());

      if (fetchedApp.isEmpty()) {
        throw new HttpMessageConversionException(String.format("Environment could not be updated: app with key '%s' does not exist.", envDto.getAppKey()));
      }
      if (es.exists(envDto.getAppKey(), envDto.getName())
        && !envDto.getAppKey().equals(appKey)
        && !envDto.getName().equals(envKey)) {
        throw new DataIntegrityViolationException(String.format("Environment could not be updated: environment '%s' already exists for app '%s'.", envDto.getName(), envDto.getAppKey()));
      }

      envToUpdate.setName(envDto.getName());
      envToUpdate.setApp(fetchedApp.get());
    } else {
      throw new NotFoundException();
    }
  }

  // DONE TEST - TODO odebrání, pokud existuje release
  //  delete prostředí aplikace - DELETE /api/apps/:key/envs/:envkey
  //  kontrolovat, že pro prostředí neexistují release, jinak nepovolit smazání
  @DeleteMapping(path = "{key}/envs/{envKey}")
  @ResponseStatus(value = HttpStatus.OK)
  void deleteAppEnv(@PathVariable("key") String appKey,
                    @PathVariable("envKey") String envKey) throws NotFoundException {
    Optional<Environment> fetchedEnv = es.get(appKey, envKey);

    if (fetchedEnv.isPresent()){
      Environment envToDelete = fetchedEnv.get();

      if (envToDelete.hasRelease()) {
        throw new DataIntegrityViolationException("Environment could not be deleted: Env has releases.");
      }
      es.delete(envToDelete);
    } else {
      throw new NotFoundException();
    }
  }
}
