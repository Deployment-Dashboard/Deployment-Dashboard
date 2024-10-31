package cz.oksystem.deployment_dashboard.serviceAndRepository;

import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.DuplicateKeyException;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.NotManagedException;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.ParentingTooDeepException;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.RecursiveAppParentingException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AppService {
  private final AppRepository ar;
  private static final HashMap<String, Integer> archivationCounter = new HashMap<>();


  public AppService(AppRepository appRepository) {
    this.ar = appRepository;
  }

  @Transactional
  public App save(App app) throws DuplicateKeyException, RecursiveAppParentingException, ParentingTooDeepException, NotManagedException {
    if (exists(app)) {
      throw new DuplicateKeyException(App.class, app.getKey());
    }
    if (app.getParent().isPresent()) {
      App parentApp = app.getParent().get();

      if (parentApp.equals(app)) {
        throw new RecursiveAppParentingException();
      }
      if (parentApp.getParent().isPresent() || !app.getComponents().isEmpty()) {
        throw new ParentingTooDeepException();
      }
      if (!exists(parentApp)) {
        throw new NotManagedException(App.class, parentApp.getKey());
      }
      parentApp.addComponent(app);
    }
    return ar.save(app);
  }

  @Transactional
  public List<App> saveAll(App app, App ... apps) {
    List<App> appsToSave = new ArrayList<>();

    appsToSave.add(app);
    Collections.addAll(appsToSave, apps);

    return saveAll(appsToSave);
  }

  @Transactional
  public List<App> saveAll(List<App> apps) {
    List<App> savedApps = new ArrayList<>();

    for (App app: apps) {
      savedApps.add(save(app));
    }
    return savedApps;
  }

  @Transactional
  public App update(String keyToUpdate, App updateWith) throws NotManagedException, DuplicateKeyException, RecursiveAppParentingException {
    Optional<App> fetchedApp = get(keyToUpdate);

    if (fetchedApp.isEmpty()) {
      throw new NotManagedException(App.class, keyToUpdate);
    }
    if (!keyToUpdate.equals(updateWith.getKey()) && exists(updateWith.getKey())) {
      throw new DuplicateKeyException(App.class, updateWith.getKey());
    }

    App appToUpdate = fetchedApp.get();

    if (updateWith.getParent().isPresent()) {
      App parentApp = updateWith.getParent().get();

      if (!exists(parentApp)) {
        throw new NotManagedException(App.class, parentApp.getKey());
      }
      if (parentApp.getParent().isPresent() || !appToUpdate.getComponents().isEmpty()) {
        throw new ParentingTooDeepException();
      }
      if (parentApp.equals(appToUpdate)) {
        throw new RecursiveAppParentingException();
      }
    }

    appToUpdate.setKey(updateWith.getKey());
    appToUpdate.setName(updateWith.getName());
    appToUpdate.setParent(updateWith.getParent().isPresent() ? updateWith.getParent().get() : null);

    if (updateWith.getArchivedTimestamp().isPresent()) {
      archive(appToUpdate);
    }
    return appToUpdate;
  }

  @Transactional
  public App update(String keyToUpdate, AppDto updateWith) throws NotManagedException, DuplicateKeyException, RecursiveAppParentingException {
    return update(keyToUpdate, entityFromDto(updateWith));
  }

  @Transactional
  public void archive(App app) throws NotManagedException {
    if (!exists(app)) {
      throw new NotManagedException(App.class, app.getKey());
    }

    // jelikož archivované appky jsou pouze označeny nastavením archived timestamp, musíme změnit key, aby se uvolnil pro další použití
    int count = archivationCounter.getOrDefault(app.getKey(), 1);
    app.setKey(String.format("%s (archiv #%d)", app.getKey(), count));
    app.setArchivedTimestamp(LocalDateTime.now());
    archivationCounter.put(app.getKey(), count + 1);
  }

  @Transactional
  public void archive(String key) throws NotManagedException {
    Optional<App> appToArchive = get(key);

    if (appToArchive.isPresent()) {
      archive(appToArchive.get());
    } else {
      throw new NotManagedException(App.class, key);
    }
  }

  @Transactional
  public void delete(App app) throws NotManagedException {
    if (!exists(app)) {
      throw new NotManagedException(App.class, app.getKey());
    }
    if (app.hasDeployment()) {
      throw new DataIntegrityViolationException("App has deployments!");
    }
    ar.delete(app);
  }

  @Transactional
  public void delete(String key) throws NotManagedException {
    Optional<App> appToDelete = get(key);

    if (appToDelete.isPresent()) {
      delete(appToDelete.get());
    } else {
      throw new NotManagedException(App.class, key);
    }
  }

  @Transactional(readOnly = true)
  public boolean exists(String key) { return ar.existsByKey(key); }

  @Transactional(readOnly = true)
  public boolean exists(App app) {
    return exists(app.getKey()); }

  @Transactional(readOnly = true)
  public Optional<App> get(String key) { return get(key, false); }

  @Transactional(readOnly = true)
  public Optional<App> get(String key, boolean alsoDeleted) { return alsoDeleted ? ar.findByKeyAndArchivedTimestampIsNull(key) : ar.findByKey(key); }

  @Transactional(readOnly = true)
  public Optional<App> getProject(String key) {
    return ar.findByKeyAndParentIsNull(key);
  }

  @Transactional(readOnly = true)
  public App entityFromDto(AppDto appDto) throws RecursiveAppParentingException, NotManagedException {
    Optional<App> parentApp = Optional.empty();

    if (appDto.getParent().isPresent()) {
      if (appDto.getParent().get().equals(appDto.getKey())) {
        throw new RecursiveAppParentingException();
      }

      parentApp = get(appDto.getParent().get());

      if (parentApp.isEmpty()) {
        throw new NotManagedException(App.class, appDto.getParent().get());
      }
    }

    App app = new App();
    app.setKey(appDto.getKey());
    app.setName(appDto.getName());

    if (parentApp.isPresent()) {
      app.setParent(parentApp.get());
    }

    if (appDto.getArchivedTimestamp().isPresent()) {
      app.setArchivedTimestamp(appDto.getArchivedTimestamp().get());
    }
    return app;
  }

  public void resetArchivationCounter() {
    archivationCounter.clear();
  }
}
