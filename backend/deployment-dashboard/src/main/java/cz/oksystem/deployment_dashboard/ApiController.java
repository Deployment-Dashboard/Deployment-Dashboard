package cz.oksystem.deployment_dashboard;

import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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

  @ExceptionHandler(DataIntegrityViolationException.class)
  @ResponseStatus(value = HttpStatus.CONFLICT)
  String conflict(DataIntegrityViolationException ex) {
    return ex.getMessage();
  }

  @ExceptionHandler(HttpMessageConversionException.class)
  @ResponseStatus(value = HttpStatus.BAD_REQUEST)
  String messageConversionException(HttpMessageConversionException ex) {
    return ex.getMessage();
  }

  @ExceptionHandler(NotFoundException.class)
  @ResponseStatus(value = HttpStatus.NOT_FOUND)
  String notFoundException(NotFoundException ex) {
    return ex.getMessage();
  }

  void checkBindingResult(BindingResult result) throws HttpMessageConversionException {
    if (result.hasErrors()) {
      StringBuilder sb = new StringBuilder();

      result.getAllErrors().forEach((error) -> {
        sb.append(error.getDefaultMessage()).append(System.lineSeparator());
      });

      throw new HttpMessageConversionException(sb.toString());
    }
  }

  //nová aplikace - POST /api/apps
  //kontrolovat duplicity klice aplikace - DONE
  @PostMapping(consumes = "application/json")
  @ResponseStatus(value = HttpStatus.CREATED)
  void addApp(@Valid @RequestBody AppDto appDto,
              BindingResult result) throws DataIntegrityViolationException {
    checkBindingResult(result);
    as.save(as.entityFromDto(appDto));
  }

  //update aplikace - PUT /api/apps/:key
  //kontrolovat duplicity klice aplikace
  @PutMapping("{key}")
  @ResponseStatus(value = HttpStatus.OK)
  void updateApp(@PathVariable("key") String key,
                                   @Valid @RequestBody AppDto appDto,
                                   BindingResult result) throws DataIntegrityViolationException, NotFoundException {
    checkBindingResult(result);

    Optional<App> appToUpdate = as.findByKey(key);

    if (appToUpdate.isPresent()) {
      App app = appToUpdate.get();

      app.setKey(appDto.getKey());
      app.setName(appDto.getName());
      app.setParent(appDto.getParent());
      app.setDeleted(appDto.getDeleted());
    } else {
      throw new NotFoundException();
    }
  }

  //smazat aplikaci - DELETE /api/apps/:key
  //povolit pouze pokud neexistují žádné aplikační release
  @DeleteMapping("{key}")
  @ResponseStatus(value = HttpStatus.OK)
  void deleteApp(@PathVariable("key") String key) {
    Optional<App> appToDelete = as.findByKeyAndDeletedIsNull(key);

    if (appToDelete.isPresent()) {
      App app = appToDelete.get();

      app.setDeleted(LocalDateTime.now());
    }
  }

  //nová verze - GET /api/apps/:abbrev/envs/:env/versions/:version?ticket=:urlencoded_ticket_link:&component=:component_1:&component=:component_2:&components_only=true
  //pokud neexistuje aplikace, vrací chybu
  //pokud neexistuje prostředí, vrací chybu
  //pokud neexistuje verze, vytvoří verzi (toto navíc ovliňuje flag components_only)
  //pokud neexistuje komponenta, vrací chybu
  //vytvoří záznam deploymentu k dané verzi a aplikaci / komponentám
  //components_only - pokud je true, nevytváříme záznam k aplikace, pouze ke komponentám
  //musí existovat alespoň jedna komponenta
  @GetMapping("{key}/envs/{envkey}/versions/{version}")
  @ResponseStatus(value = HttpStatus.OK)
  void newVersion(@PathVariable("key") String appKey,
                  @PathVariable("envkey") String envKey,
                  @PathVariable("version") String version,
                  @RequestParam("ticket") String urlEncodedTicket,
                  @RequestParam("component") List<String> components,
                  @RequestParam("components_only") boolean componentsOnly){

  }
  //získání všech verzí projektu - GET /api/apps/:key
//  @GetMapping("{key}")
//  @ResponseStatus(value = HttpStatus.OK)
//  ResponseEntity<List<Version>> getAllVersions(@PathVariable("key") String key) {
//
//  }


  //získání všech prostředí - GET /api/apps/:abbrev/envs
  @GetMapping("{key}/envs")
  @ResponseStatus(value = HttpStatus.OK)
  ResponseEntity<List<Environment>> getAppEnvs(@PathVariable("key") String key) {
    Optional<App> fetchedApp = as.findByKey(key);

    if (fetchedApp.isPresent()) {
      App app = fetchedApp.get();

      return ResponseEntity.ok(es.findAllByApp(app));
    } else {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }

  //nové prostředí aplikace - POST /api/apps/:abbrev/envs
  //zakázat duplicity
  @PostMapping(path = "{key}/envs", consumes = "application/json")
  @ResponseStatus(value = HttpStatus.CREATED)
  void addAppEnv(@Valid @RequestBody EnvironmentDto envDto,
              BindingResult result) throws HttpMessageConversionException, DataIntegrityViolationException {
    checkBindingResult(result);
    es.save(es.entityFromDto(envDto));
  }


  //update prostředí aplikace - PUT /api/apps/:key/envs/:envkey
  //zakázat duplicity

  //delete prostředí aplikace - DELETE /api/apps/:key/envs/:envkey
  //kontrolovat, že pro prostředí neexistují release, jinak nepovolit smazání
}
