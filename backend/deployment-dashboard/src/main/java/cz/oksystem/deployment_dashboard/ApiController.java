package cz.oksystem.deployment_dashboard;

import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Deployment;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.entity.Version;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.*;
import cz.oksystem.deployment_dashboard.serviceAndRepository.AppService;
import cz.oksystem.deployment_dashboard.serviceAndRepository.DeploymentService;
import cz.oksystem.deployment_dashboard.serviceAndRepository.EnvironmentService;
import jakarta.validation.Valid;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;


//API
//Chceme jednoduché klikání při nasazení verze, žádné složité vyplňování. API proto nebude RESTful.
@RestController
@RequestMapping("/api/apps")
class ApiController {
  private final AppService as;
  private final EnvironmentService es;
  private final DeploymentService ds;


  public ApiController(AppService as, EnvironmentService es, DeploymentService ds) {
    this.as = as;
    this.es = es;
    this.ds = ds;
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
      as.save(as.entityFromDto(appDto));
    } catch (HttpMessageConversionException | DuplicateKeyException | RecursiveAppParentingException | NotManagedException ex) {
      throw new EntityAdditionException(App.class, ex);
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
      as.update(key, appDto);
    } catch (HttpMessageConversionException | NotManagedException | DuplicateKeyException | RecursiveAppParentingException ex) {
      throw new EntityUpdateException(App.class, ex);
    }
  }

  // DONE - TODO test smazání, pokud je release, jinak povolit pouze archivaci
  //  smazat aplikaci - DELETE /api/apps/:key
  //  povolit pouze pokud neexistují žádné aplikační release
  @DeleteMapping("{key}")
  @ResponseStatus(value = HttpStatus.OK)
  void archiveOrDeleteApp(@PathVariable("key") String key,
                          @RequestParam(value = "hard_delete", required = false) boolean hardDelete) {
    try {
      if (hardDelete) {
        as.delete(key);
      } else {
        as.archive(key);
      }
    } catch (NotManagedException ex) {
      throw new EntityDeletionOrArchivationException(App.class, ex);
    }
  }

  // DONE - TODO testy + pořešit přijímání popisků pro appku a komponenty (umožnit komentovat každé zvlášť nebo prostě jeden popisek pro všechno?) + data
  //  nová verze - GET /api/apps/:key/envs/:envkey/versions/:version?ticket=:urlencoded_ticket_link:&component=:component_1:&component=:component_2:&components_only=true
  //  pokud neexistuje aplikace, vrací chybu
  //  pokud neexistuje prostředí, vrací chybu
  //  pokud neexistuje verze, vytvoří verzi (toto navíc ovliňuje flag components_only)
  //  pokud neexistuje komponenta, vrací chybu
  //  vytvoří záznam deploymentu k dané verzi a aplikaci / komponentám
  //  components_only - pokud je true, nevytváříme záznam k aplikace, pouze ke komponentám
  //    musí existovat alespoň jedna komponenta
  //
  @GetMapping("{key}/envs/{envKey}/versions/{version}")
  @ResponseStatus(value = HttpStatus.OK)
  void newVersion(@PathVariable("key") String appKey,
                  @PathVariable("envKey") String envKey,
                  @PathVariable("version") String versionName,
                  @RequestParam(value = "ticket", required = false) String urlEncodedTicket,
                  @RequestParam(value = "component", required = false) List<String> components,
                  @RequestParam(value = "components_only", required = false) boolean componentsOnly) {
    try {
      Optional<App> fetchedApp = as.get(appKey);

      if (fetchedApp.isEmpty()) {
        throw new NotManagedException(App.class, appKey);
      }

      App appToRelease = fetchedApp.get();
      List<App> componentsToRelease = new ArrayList<>();

      if (!componentsOnly) {
        componentsToRelease.add(appToRelease);
      } else {
        if (appToRelease.getComponents().isEmpty()) {
          throw new IllegalArgumentException(String.format("componentsOnly flag was raised, but %s has none.", appKey));
        }
      }

      if (components == null || components.isEmpty()) {
        componentsToRelease.addAll(appToRelease.getComponents());
      } else {
        for (String componentKey : components) {
          Optional<App> fetchedComponent = as.get(componentKey);

          if (fetchedComponent.isEmpty() || !appToRelease.getComponents().contains(fetchedComponent.get())) {
            throw new NotManagedException(App.class, componentKey);
          }
          componentsToRelease.add(fetchedComponent.get());
        }
      }
      List<Version> versionsToDeploy = new ArrayList<>();

      for (App component : componentsToRelease) {
        versionsToDeploy.add(new Version(component, versionName));
      }

      ds.deployAll(versionsToDeploy, envKey, urlEncodedTicket, LocalDateTime.now());
    } catch (Exception ex) {
      throw new EntityAdditionException(Deployment.class, ex);
    }
  }

  // DONE - TODO testy
  //  získání všech verzí projektu - GET /api/apps/:key
  @GetMapping("{key}")
  @ResponseStatus(value = HttpStatus.OK)
  ResponseEntity<List<Version>> getAllVersions(@PathVariable("key") String key) {
    try {
      Optional<App> fetchedApp = as.get(key);

      if (fetchedApp.isEmpty()) {
        throw new NotManagedException(App.class, key);
      }
      return ResponseEntity.ok(fetchedApp.get().getVersions());
    } catch (NotManagedException ex) {
      throw new EntityFetchException(App.class, ex);
    }
  }

  // DONE TESTED
  //  získání všech prostředí - GET /api/apps/:key/envs
  @GetMapping("{key}/envs")
  @ResponseStatus(value = HttpStatus.OK)
  ResponseEntity<List<Environment>> getAllAppEnvs(@PathVariable("key") String key) {
    try {
      Optional<App> fetched = as.get(key);

      if (fetched.isEmpty()) {
        throw new NotManagedException(App.class, key);
      }
      return ResponseEntity.ok(fetched.get().getEnvs());
    } catch (NotManagedException ex) {
      throw new EntityFetchException(Environment.class, ex);
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
      es.save(es.entityFromDto(envDto));
    } catch (HttpMessageConversionException | NotManagedException | DuplicateKeyException ex) {
      throw new EntityAdditionException(Environment.class, ex);
    }
  }

  // DONE TESTED
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
      es.update(appKey, envKey, envDto);
    } catch (Exception ex) {
      throw new EntityUpdateException(Environment.class, ex);
    }
  }

  // DONE TESTED - TODO odebrání, pokud existuje deployment
  //  delete prostředí aplikace - DELETE /api/apps/:key/envs/:envkey
  //  kontrolovat, že pro prostředí neexistují release, jinak nepovolit smazání
  @DeleteMapping(path = "{key}/envs/{envKey}")
  @ResponseStatus(value = HttpStatus.OK)
  void deleteAppEnv(@PathVariable("key") String appKey,
                    @PathVariable("envKey") String envKey) {
    try {
      es.delete(appKey, envKey);
    } catch (NotManagedException ex) {
      throw new EntityDeletionOrArchivationException(Environment.class, ex);
    }
  }
}
