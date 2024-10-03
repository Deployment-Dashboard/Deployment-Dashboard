package cz.oksystem.deployment_dashboard.serviceAndRepository;

import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.entity.App;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;

@Service
public class AppService {
  private final AppRepository ar;
  private static final HashMap<String, Integer> deletionSuffix = new HashMap<>();

  public AppService(AppRepository appRepository) {
    this.ar = appRepository;
  }

  @Transactional
  public App save(App app) {
    deletionSuffix.put(app.getKey(), 1);

    return ar.save(app);
  }

  @Transactional
  public void delete(App app) {
    delete(app, LocalDateTime.now());
  }

  @Transactional
  public void delete(App app, LocalDateTime deletedAt) {
    // jelikož smazané appky jsou pouze označeny nastavením deleted timestamp, musíme změnit key, aby se uvolnil pro další použití
    int suffix = getDeletionSuffixForKey(app.getKey());
    incrementDeletionSuffix(app.getKey());
    app.setKey(app.getKey() + suffix);
    app.setDeleted(deletedAt);
  }

  @Transactional(readOnly = true)
  public boolean exists(String key) { return ar.existsByKey(key); }

  @Transactional
  public Optional<App> getByKeyEvenDeleted(String key) { return ar.findByKey(key); }

  @Transactional
  public List<App> getProjects() { return ar.findAll(); }

  @Transactional
  public Optional<App> getByKey(String key) { return ar.findByKeyAndDeletedIsNull(key); }

  @Transactional
  public int getDeletionSuffixForKey(String key) { return deletionSuffix.get(key); }

  public void incrementDeletionSuffix(String key) {
    deletionSuffix.put(key, deletionSuffix.get(key) + 1);
  }

  @Transactional
  public Optional<App> entityFromDto(AppDto appDto) {
    Optional<App> parentApp = Optional.empty();

    if (appDto.getParent().isPresent()) {
      parentApp = getByKey(appDto.getParent().get());

      if (parentApp.isEmpty()) {
        return Optional.empty();
      }
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

    return Optional.of(app);
  }
}
