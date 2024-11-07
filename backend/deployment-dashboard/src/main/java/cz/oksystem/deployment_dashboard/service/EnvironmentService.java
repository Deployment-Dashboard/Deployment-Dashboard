package cz.oksystem.deployment_dashboard.service;

import cz.oksystem.deployment_dashboard.dto.EnvironmentDto;
import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.DuplicateKeyException;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.NotManagedException;
import cz.oksystem.deployment_dashboard.repository.EnvironmentRepository;
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
  public Environment save(Environment newEnv) {
    if (!appService.exists(newEnv.getApp())) {
      throw new NotManagedException(App.class, newEnv.getApp().getKey());
    }
    if (this.exists(newEnv.getApp().getKey(), newEnv.getName())) {
      throw new DuplicateKeyException(Environment.class, newEnv.getApp().getKey() + "-" + newEnv.getName());
    }
    newEnv.getApp().addEnvironment(newEnv);
    return environmentRepository.save(newEnv);
  }

  @Transactional
  public List<Environment> saveAll(List<Environment> envs) {
    List<Environment> savedEnvs = new ArrayList<>();

    for (Environment env : envs) {
      savedEnvs.add(this.save(env));
    }
    return savedEnvs;
  }

  @Transactional
  public List<Environment> saveAll(Environment env, Environment ... envs) {
    List<Environment> envsToSave = new ArrayList<>();

    envsToSave.add(env);
    Collections.addAll(envsToSave, envs);

    return this.saveAll(envsToSave);
  }

  @Transactional(readOnly = true)
  public Environment entityFromDto(EnvironmentDto envDto) {
    Optional<App> app = appService.get(envDto.getAppKey());

    if (app.isEmpty()) {
      throw new NotManagedException(App.class, envDto.getAppKey());
    }
    return new Environment(envDto.getName(), app.get());
  }

  @Transactional
  public void update(String appKey, String keyToUpdate, EnvironmentDto updateWith) {
    if (!appService.exists(appKey)) {
      throw new NotManagedException(App.class, appKey);
    }

    Optional<App> fetchedApp = appService.get(updateWith.getAppKey());
    Optional<Environment> fetchedEnv = this.get(appKey, keyToUpdate);

    if (fetchedApp.isEmpty()) {
      throw new NotManagedException(App.class, updateWith.getAppKey());
    }
    if (fetchedEnv.isEmpty()) {
      throw new NotManagedException(Environment.class, keyToUpdate);
    }

    Environment envToUpdate = fetchedEnv.get();
    App newApp = fetchedApp.get();

    if (this.exists(envToUpdate.getApp().getKey(), updateWith.getName())) {
      throw new DuplicateKeyException(Environment.class, newApp.getKey() + "-" + updateWith.getName());
    }
    envToUpdate.setName(updateWith.getName());
  }

  @Transactional
  public void delete(String appKey, String envKey) {
    if (!appService.exists(appKey)) {
      throw new NotManagedException(App.class, appKey);
    }

    Optional<Environment> fetchedEnv = this.get(appKey, envKey);

    if (fetchedEnv.isEmpty()) {
      throw new NotManagedException(Environment.class, envKey);
    }

    Environment envToDelete = fetchedEnv.get();

    if (!envToDelete.hasDeployment()) {
      envToDelete.getApp().removeEnvironment(envToDelete);
      environmentRepository.delete(envToDelete);
    }
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
}
