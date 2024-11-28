package cz.oksystem.deployment_dashboard.service;

import cz.oksystem.deployment_dashboard.entity.Deployment;
import cz.oksystem.deployment_dashboard.entity.Environment;
import cz.oksystem.deployment_dashboard.entity.Version;
import cz.oksystem.deployment_dashboard.repository.DeploymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class DeploymentService {
  private final DeploymentRepository deploymentRepository;

  public DeploymentService(DeploymentRepository deploymentRepository) { this.deploymentRepository = deploymentRepository; }

  @Transactional
  public Deployment save(Deployment deployment) {
    Optional<Deployment> fetchedDeployment = this.get(deployment);
    Deployment ret;

    if (fetchedDeployment.isPresent()) {
      fetchedDeployment.get().setDate(LocalDateTime.now());

      ret = fetchedDeployment.get();
    } else {
      ret = deploymentRepository.save(deployment);
    }

    Environment envToDeployTo = deployment.getEnvironment();
    Version versionToDeploy = deployment.getVersion();

    if (!envToDeployTo.getDeployments().contains(deployment)) {
      envToDeployTo.addDeployment(deployment);
    }
    if (!versionToDeploy.getDeployments().contains(deployment)) {
      versionToDeploy.addDeployment(deployment);
    }

    return ret;
  }

  @Transactional(readOnly = true)
  public Optional<Deployment> get(Deployment deployment) {
    String appKey = deployment.getEnvironment().getApp().getKey();
    String envKey = deployment.getEnvironment().getName();
    String versionName = deployment.getVersion().getName();

    return this.get(appKey, envKey, versionName);
  }

  @Transactional(readOnly = true)
  public Optional<Deployment> get(String appKey, String envKey, String versionName) {
    return deploymentRepository.findByAppAndEnvironmentAndVersion(appKey, envKey, versionName);
  }
}
