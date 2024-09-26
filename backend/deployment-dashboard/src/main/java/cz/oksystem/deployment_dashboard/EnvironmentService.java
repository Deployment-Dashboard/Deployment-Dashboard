package cz.oksystem.deployment_dashboard;

import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

  public List<Environment> findAllByApp(App app) { return er.findAllByApp(app); }

  public Environment entityFromDto(EnvironmentDto envDto) {
    Environment env = new Environment();
    env.setName(envDto.getName());

    Optional<App> app = as.findByKey(envDto.getAppKey());

    if (app.isEmpty()) { return null; }

    env.setApp(app.get());

    return  env;
  }
}
