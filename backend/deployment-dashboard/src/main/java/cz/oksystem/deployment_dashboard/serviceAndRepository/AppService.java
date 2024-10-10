package cz.oksystem.deployment_dashboard.serviceAndRepository;

import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.entity.App;
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AppService {
  private final AppRepository ar;
  private static final HashMap<String, Integer> deletionCounter = new HashMap<>();


  public AppService(AppRepository appRepository) {
    this.ar = appRepository;
  }

  @Transactional
  public App save(App app) {
    return ar.save(app);
  }

  @Transactional
  public List<App> save(App app, App ... apps) {
    List<App> appsToSave = new ArrayList<>();

    appsToSave.add(app);
    Collections.addAll(appsToSave, apps);

    return save(appsToSave);
  }

  @Transactional
  public List<App> save(List<App> apps) {
    List<App> savedApps = new ArrayList<>();

    for (App app: apps) {
      savedApps.add(save(app));
    }
    return savedApps;
  }

  @Transactional
  public void delete(App app) {
    // jelikož smazané appky jsou pouze označeny nastavením deleted timestamp, musíme změnit key, aby se uvolnil pro další použití
    int count = deletionCounter.getOrDefault(app.getKey(), 1);
    app.setKey(app.getKey() + count);
    app.setDeleted(LocalDateTime.now());
    deletionCounter.put(app.getKey(), count + 1);
  }

  @Transactional(readOnly = true)
  public boolean exists(String key) { return ar.existsByKey(key); }

  @Transactional(readOnly = true)
  public List<App> getAll() { return ar.findAll(); }

  @Transactional(readOnly = true)
  public Optional<App> get(String key) { return get(key, false); }

  @Transactional(readOnly = true)
  public Optional<App> get(String key, boolean alsoDeleted) { return alsoDeleted ? ar.findByKeyAndDeletedIsNull(key) : ar.findByKey(key); }

  @Transactional(readOnly = true)
  public Optional<App> getProject(String key) {
    return ar.findByKeyAndParentIsNull(key);
  }

  @Transactional(readOnly = true)
  public App entityFromDto(AppDto appDto) throws NotFoundException {
    Optional<App> parentApp = Optional.empty();

    if (appDto.getParent().isPresent()) {
      parentApp = get(appDto.getParent().get());

      if (parentApp.isEmpty()) { throw new NotFoundException(); }
    }

    App app = new App();
    app.setKey(appDto.getKey());
    app.setName(appDto.getName());

    if (parentApp.isPresent()) {
      app.setParent(parentApp.get());
    }

    if (appDto.getDeleted().isPresent()) {
      app.setDeleted(appDto.getDeleted().get());
    }

    return app;
  }

  public int getDeletionSuffixForKey(String key) {
    return deletionCounter.getOrDefault(key, -1);
  }

  public void resetDeletionCounter() {
    deletionCounter.clear();
  }
}
