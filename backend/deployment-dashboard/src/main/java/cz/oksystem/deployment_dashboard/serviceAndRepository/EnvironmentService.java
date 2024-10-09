package cz.oksystem.deployment_dashboard.serviceAndRepository;

import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
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

  @Transactional
  public List<Environment> save(Environment env, Environment ... envs) {
    List<Environment> envsToSave = new ArrayList<>();

    envsToSave.add(env);
    Collections.addAll(envsToSave, envs);

    return save(envsToSave);
  }

  @Transactional
  public List<Environment> save(List<Environment> envs) {
    List<Environment> savedEnvs = new ArrayList<>();

    for (Environment env: envs) {
      savedEnvs.add(save(env));
    }
    return savedEnvs;
  }

  @Transactional
  public void delete(Environment env) { er.delete(env); }

  @Transactional(readOnly = true)
  public boolean exists(String appKey, String envKey) {
    Optional<App> fetchedApp = as.get(appKey);

    if (fetchedApp.isPresent()) {
      return er.existsByAppAndName(fetchedApp.get(), envKey);
    } else {
      return false;
    }
  }

  @Transactional(readOnly = true)
  public Optional<Environment> get(String appKey, String name) {
    Optional<App> fetchedApp = as.get(appKey);

    if (fetchedApp.isPresent()) {
      return er.findByAppAndName(fetchedApp.get(), name);
    } else {
      return Optional.empty();
    }
  }

  public Environment entityFromDto(EnvironmentDto envDto) throws NotFoundException {
    Optional<App> app = as.get(envDto.getAppKey());
    if (app.isEmpty()) { throw new NotFoundException(); }

    Environment env = new Environment();
    env.setName(envDto.getName());
    env.setApp(app.get());

    return env;
  }
}
