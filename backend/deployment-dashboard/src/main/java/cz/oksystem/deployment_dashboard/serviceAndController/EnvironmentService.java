package cz.oksystem.deployment_dashboard.serviceAndController;

import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class EnvironmentService {
  private final EnvironmentRepository er;
  private final AppService as;

  public EnvironmentService(EnvironmentRepository er, AppService as) {
    this.er = er;
    this.as = as;
  }

  @Transactional
  public Environment save(Environment env) {
    return er.save(env);
  }

  @Transactional
  public void delete(Environment env) { er.delete(env); }

  @Transactional
  public Optional<Environment> findByNameAndApp(String key, Optional<App> app) { return app.map(value -> er.findByNameAndApp(key, value)).orElse(null); }

  public Environment entityFromDto(EnvironmentDto envDto) {
    Optional<App> app = as.getByKeyEvenDeleted(envDto.getAppKey());
    if (app.isEmpty()) { return null; }

    Environment env = new Environment();
    env.setName(envDto.getName());
    env.setApp(app.get());

    return env;
  }
}
