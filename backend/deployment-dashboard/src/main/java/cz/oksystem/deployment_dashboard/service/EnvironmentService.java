package cz.oksystem.deployment_dashboard.service;

import cz.oksystem.deployment_dashboard.entity.App;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions;
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

  public EnvironmentService(EnvironmentRepository environmentRepository) {
    this.environmentRepository = environmentRepository;
  }

  @Transactional
  public Environment save(Environment newEnv) {
    this.validate(newEnv);

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
  void validate(Environment env) {
    this.get(env.getApp().getKey(), env.getName()).ifPresent(fetchedEnv -> {
      if (fetchedEnv != env) {
        throw new CustomExceptions.DuplicateKeyException(
          Environment.class, env.getApp().getKey(), env.getName()
        );
      }
    });
  }

  @Transactional
  public void update(String appKey, String envKeyToUpdate, Environment updateWith) {
    Environment envToUpdate = this.get(appKey, envKeyToUpdate).orElseThrow(
      () -> new CustomExceptions.NotManagedException(
        Environment.class, App.class, envKeyToUpdate, appKey
      )
    );

    envToUpdate.setName(updateWith.getName());

    this.validate(envToUpdate);
  }

  @Transactional
  public void delete(String appKey, String envKeyToDelete) {
    Environment envToDelete = this.get(appKey, envKeyToDelete).orElseThrow(
      () -> new CustomExceptions.NotManagedException(
        Environment.class, App.class, envKeyToDelete, appKey
      )
    );

    if (envToDelete.hasDeployment()) {
      throw new CustomExceptions.DeletionNotAllowedException(
        Environment.class, envKeyToDelete
      );
    }

    envToDelete.getApp().removeEnvironment(envToDelete);
    environmentRepository.delete(envToDelete);
  }

  @Transactional(readOnly = true)
  public boolean exists(String appKey, String envKey) {
    return environmentRepository.existsByAppKeyAndName(appKey, envKey);
  }

  @Transactional(readOnly = true)
  public Optional<Environment> get(String appKey, String name) {
    return environmentRepository.findByAppKeyAndName(appKey, name);
  }
}
