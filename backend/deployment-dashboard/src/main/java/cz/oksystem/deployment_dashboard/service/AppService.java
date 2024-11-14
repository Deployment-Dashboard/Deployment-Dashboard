package cz.oksystem.deployment_dashboard.service;

import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions;
import cz.oksystem.deployment_dashboard.repository.AppRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

// TODO - přidat podporu pro unarchive (podle vývoje API)
@Service
public class AppService {

  private final AppRepository appRepository;

  public AppService(AppRepository appRepository) {
    this.appRepository = appRepository;
  }

  @Transactional
  public App save(App newApp) {
    this.validate(newApp);

    newApp.getParent().ifPresent(
      parent -> parent.addComponent(newApp)
    );

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


  private void validate(App app) {
    this.get(app.getKey()).ifPresent(fetchedApp -> {
      if (!app.equals(fetchedApp)) {
        throw new CustomExceptions.DuplicateKeyException(App.class, app.getKey());
      }
    });

    app.getParent().ifPresent(parentApp -> {
      if (!this.exists(parentApp)) {
        throw new CustomExceptions.NotManagedException(App.class, parentApp.getKey());
      }
      if (app.hasCycle()) {
        throw new CustomExceptions.RecursiveAppParentingException();
      }
    });
  }

  @Transactional
  public App update(String appKeyToUpdate, App updateWith) {
    App appToUpdate = this.get(appKeyToUpdate).orElseThrow(
      () -> new CustomExceptions.NotManagedException(App.class, appKeyToUpdate)
    );

    appToUpdate.setKey(updateWith.getKey());
    appToUpdate.setName(updateWith.getName());

    appToUpdate.getParent().ifPresent(
      parent -> parent.removeComponent(appToUpdate)
    );

    appToUpdate.setParent(updateWith.getParent().orElse(null));

    appToUpdate.getParent().ifPresent(
      parent -> parent.addComponent(appToUpdate)
    );

    appToUpdate.setArchivedTimestamp(updateWith.getArchivedTimestamp().orElse(null));

    this.validate(appToUpdate);

    return appToUpdate;
  }

  @Transactional
  public void delete(String appKeyToDelete, boolean hardDelete) {
    App appToDelete = this.get(appKeyToDelete).orElseThrow(
      () -> new CustomExceptions.NotManagedException(App.class, appKeyToDelete)
    );

    if (!hardDelete) {
      appToDelete.setArchivedTimestamp(LocalDateTime.now());
      return;
    }

    if (appToDelete.hasDeployment()) {
      throw new CustomExceptions.DeletionNotAllowedException(
        App.class, appToDelete.getKey()
      );
    }

    for (App component : appToDelete.getComponents()) {
      this.delete(component.getKey(), true);
    }

    appToDelete.getParent().ifPresent(
      parent -> parent.removeComponent(appToDelete)
    );

    appRepository.delete(appToDelete);
  }

  public boolean exists(String key) {
    return appRepository.existsByKey(key);
  }

  public boolean exists(App app) {
    return this.exists(app.getKey());
  }

  public Optional<App> get(String key) {
    return this.get(key, false);
  }

  public Optional<App> get(String key, boolean alsoArchived) {
    return alsoArchived
      ? appRepository.findByKeyAndArchivedTimestampIsNull(key)
      : appRepository.findByKey(key);
  }
}
