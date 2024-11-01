package cz.oksystem.deployment_dashboard.serviceAndRepository;

import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.DuplicateKeyException;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.NotManagedException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class EnvironmentService {
  private final EnvironmentRepository environmentRepository;
  private final AppService appService;

  public EnvironmentService(EnvironmentRepository environmentRepository, AppService appService) {
    this.environmentRepository = environmentRepository;
    this.appService = appService;
  }

  @Transactional
  public Environment save(Environment env) {
    if (!appService.exists(env.getApp())) {
      throw new NotManagedException(App.class, env.getApp().getKey());
    }
    if (exists(env.getApp().getKey(), env.getName())) {
      throw new DuplicateKeyException(Environment.class, env.getApp().getKey() + "-" + env.getName());
    }
    return environmentRepository.save(env);
  }

  @Transactional
  public List<Environment> saveAll(Environment env, Environment ... envs) {
    List<Environment> envsToSave = new ArrayList<>();

    envsToSave.add(env);
    Collections.addAll(envsToSave, envs);

    return saveAll(envsToSave);
  }

  @Transactional
  public List<Environment> saveAll(List<Environment> envs) {
    List<Environment> savedEnvs = new ArrayList<>();

    for (Environment env: envs) {
      savedEnvs.add(save(env));
    }
    return savedEnvs;
  }

  @Transactional
  public void update(String appKey, String keyToUpdate, EnvironmentDto updateWith) {
    if (!appService.exists(appKey)) {
      throw new NotManagedException(App.class, appKey);
    }

    Optional<App> fetchedApp = appService.get(updateWith.getAppKey());
    Optional<Environment> fetchedEnv = get(appKey, keyToUpdate);

    if (fetchedApp.isEmpty()) {
      throw new NotManagedException(App.class, updateWith.getAppKey());
    }
    if (fetchedEnv.isEmpty()) {
      throw new NotManagedException(Environment.class, keyToUpdate);
    }

    Environment envToUpdate = fetchedEnv.get();
    App newApp = fetchedApp.get();

    if (exists(newApp.getKey(), updateWith.getName())
      && !newApp.getKey().equals(appKey)
      && !updateWith.getName().equals(keyToUpdate)) {
        throw new DuplicateKeyException(Environment.class, newApp.getKey() + "-" + updateWith.getName());
    }

    envToUpdate.setName(updateWith.getName());
    envToUpdate.setApp(newApp);
  }

  @Transactional
  public void delete(String appKey, String envKey) {
    if (!appService.exists(appKey)) {
      throw new NotManagedException(App.class, appKey);
    }

    Optional<Environment> fetchedEnv = get(appKey, envKey);

    if (fetchedEnv.isEmpty()) {
      throw new NotManagedException(Environment.class, envKey);
    }

    Environment envToDelete = fetchedEnv.get();

    if (envToDelete.hasDeployment()) {
      throw new DataIntegrityViolationException("Environment has deployments!");
    }
    environmentRepository.delete(envToDelete);
  }

  @Transactional(readOnly = true)
  public boolean exists(String appKey, String envKey) {
    Optional<App> fetchedApp = appService.get(appKey);

    return fetchedApp.isPresent() && environmentRepository.existsByAppAndName(fetchedApp.get(), envKey);
  }

  @Transactional(readOnly = true)
  public Optional<Environment> get(String appKey, String name) {
    Optional<App> fetchedApp = appService.get(appKey);

    if (fetchedApp.isPresent()) {
      return environmentRepository.findByAppAndName(fetchedApp.get(), name);
    } else {
      return Optional.empty();
    }
  }

  @Transactional(readOnly = true)
  public Environment entityFromDto(EnvironmentDto envDto) {
    Optional<App> app = appService.get(envDto.getAppKey());

    if (app.isEmpty()) {
      throw new NotManagedException(App.class, envDto.getAppKey());
    }

    return new Environment(app.get(), envDto.getName());
  }
}
