package cz.oksystem.deployment_dashboard.service;

import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.DuplicateKeyException;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.NotManagedException;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.RecursiveAppParentingException;
import cz.oksystem.deployment_dashboard.repository.AppRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

// TODO - přidat podporu pro unarchive (podle vývoje API)
@Service
public class AppService {
  private final AppRepository appRepository;
  private static final HashMap<String, Integer> archivationCounter = new HashMap<>();

  public AppService(AppRepository appRepository) {
    this.appRepository = appRepository;
  }

  @Transactional
  public App save(App newApp) {
    this.validate(newApp);

    newApp.getParent().ifPresent(
      parent -> parent.addComponent(newApp));

    return appRepository.save(newApp);
  }

  @Transactional
  public List<App> saveAll(List<App> newApps) {
    List<App> savedApps = new ArrayList<>();

    for (App app: newApps) {
      savedApps.add(this.save(app));
    }
    return savedApps;
  }

  @Transactional
  public List<App> saveAll(App newApp, App ... newApps) {
    List<App> appsToSave = new ArrayList<>();

    appsToSave.add(newApp);
    Collections.addAll(appsToSave, newApps);

    return this.saveAll(appsToSave);
  }

  @Transactional(readOnly = true)
  public App entityFromDto(AppDto appDto) {
    App newApp = new App(appDto.getKey(), appDto.getName());

    appDto.getParent().ifPresent(parentKey -> {
      App parent = this.get(parentKey)
        .orElseThrow(() -> new NotManagedException(App.class, parentKey));
      newApp.setParent(parent);
    });

    this.validate(newApp);

    if (appDto.getArchivedTimestamp().isPresent()) {
      this.archive(newApp);
    }
    return newApp;
  }

  @Transactional(readOnly = true)
  void validate(App app) {
    if (this.exists(app)) {
      throw new DuplicateKeyException(App.class, app.getKey());
    }

    app.getParent().ifPresent(parentApp -> {
      if (!this.exists(parentApp)) {
        throw new NotManagedException(App.class, parentApp.getKey());
      }
      if (app.hasCycle()) {
        throw new RecursiveAppParentingException();
      }
    });
  }

  @Transactional
  public App update(String keyToUpdate, App updateWith) {
    Optional<App> fetchedApp = this.get(keyToUpdate);

    if (fetchedApp.isEmpty()) {
      throw new NotManagedException(App.class, keyToUpdate);
    }

    if (!keyToUpdate.equals(updateWith.getKey())
        && this.exists(updateWith.getKey())) {
      throw new DuplicateKeyException(App.class, updateWith.getKey());
    }

    App appToUpdate = fetchedApp.get();

    appToUpdate.setKey(updateWith.getKey());
    appToUpdate.setName(updateWith.getName());

    if (appToUpdate.getParent().isPresent()) {
      appToUpdate.getParent().get().removeComponent(appToUpdate);
    }
    appToUpdate.setParent(updateWith.getParent().orElse(null));
    if (appToUpdate.getParent().isPresent()) {
      appToUpdate.getParent().get().addComponent(appToUpdate);
    }

    this.validate(appToUpdate);

    if (updateWith.getArchivedTimestamp().isPresent()) {
      this.archive(appToUpdate);
    }

    return appToUpdate;
  }

  @Transactional
  public App update(String keyToUpdate, AppDto updateWith) {
    return this.update(keyToUpdate, entityFromDto(updateWith));
  }

  @Transactional
  public void archive(App appToArchive) throws NotManagedException {
    if (!this.exists(appToArchive)) {
      throw new NotManagedException(App.class, appToArchive.getKey());
    }
    if (appToArchive.getArchivedTimestamp().isEmpty()) {
      appToArchive.setArchivedTimestamp(LocalDateTime.now());
      appToArchive.setKey(this.getArchivationKey(appToArchive.getKey()));
    }
  }

  @Transactional
  public void archive(String key) throws NotManagedException {
    Optional<App> appToArchive = get(key);

    if (appToArchive.isPresent()) {
      this.archive(appToArchive.get());
    }
  }

  public String getArchivationKey(String appKey) {
    int count = archivationCounter.getOrDefault(appKey, 1);
    archivationCounter.put(appKey, count + 1);
    return String.format("%s (archiv #%d)", appKey, count);
  }

  @Transactional
  public void delete(App app) {
    if (!this.exists(app)) {
      throw new NotManagedException(App.class, app.getKey());
    }
    if (app.hasDeployment()) {
      throw new DataIntegrityViolationException("App has deployments.");
    }
    if (app.getParent().isPresent()) {
      app.getParent().get().removeComponent(app);
    }
    appRepository.delete(app);
  }

  @Transactional
  public void delete(String key) {
    Optional<App> appToDelete = this.get(key);

    if (appToDelete.isPresent()) {
      this.delete(appToDelete.get());
    } else {
      throw new NotManagedException(App.class, key);
    }
  }

  @Transactional(readOnly = true)
  public boolean exists(String key) {
    return appRepository.existsByKey(key);
  }

  @Transactional(readOnly = true)
  public boolean exists(App app) {
    return this.exists(app.getKey());
  }

  @Transactional(readOnly = true)
  public Optional<App> get(String key) {
    return this.get(key, false);
  }

  @Transactional(readOnly = true)
  public Optional<App> get(String key, boolean alsoArchived) {
    return alsoArchived
      ? appRepository.findByKeyAndArchivedTimestampIsNull(key)
      : appRepository.findByKey(key);
  }

  @Transactional(readOnly = true)
  public Optional<App> getProject(String key) {
    return appRepository.findByKeyAndParentIsNull(key);
  }

  public static void resetArchivationCounter() {
    archivationCounter.clear();
  }
}
