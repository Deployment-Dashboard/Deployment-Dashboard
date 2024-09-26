package cz.oksystem.deployment_dashboard;

import cz.oksystem.deployment_dashboard.dto.AppDto;
import cz.oksystem.deployment_dashboard.entity.App;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AppService {
  private final AppRepository ar;


  public AppService(AppRepository appRepository) {
    this.ar = appRepository;
  }

  @Transactional
  public App save(App app) {
    return ar.save(app);
  }

  @Transactional(readOnly = true)
  public boolean existsByKey(String key) { return ar.existsByKey(key); }

  @Transactional
  public Optional<App> findById(Long id) {
    return ar.findById(id);
  }

  @Transactional
  public Optional<App> findByKey(String key) { return ar.findByKey(key); }

  @Transactional
  public Optional<App> findByKeyAndDeletedIsNull(String key) { return ar.findByKeyAndDeletedIsNull(key); }

  public App entityFromDto(AppDto appDto) {
    App app = new App();
    app.setKey(appDto.getKey());
    app.setName(appDto.getName());
    app.setParent(appDto.getParent());
    app.setDeleted(appDto.getDeleted());

    return app;
  }
}
