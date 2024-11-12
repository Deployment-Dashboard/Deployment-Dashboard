package cz.oksystem.deployment_dashboard.service;

import cz.oksystem.deployment_dashboard.entity.Deployment;
import cz.oksystem.deployment_dashboard.repository.DeploymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeploymentService {
  private final DeploymentRepository deploymentRepository;

  public DeploymentService(DeploymentRepository deploymentRepository) { this.deploymentRepository = deploymentRepository; }

  @Transactional
  public Deployment save(Deployment deployment) {
    deployment.getEnvironment().addDeployment(deployment);
    deployment.getVersion().addDeployment(deployment);

    return deploymentRepository.save(deployment);
  }
}
