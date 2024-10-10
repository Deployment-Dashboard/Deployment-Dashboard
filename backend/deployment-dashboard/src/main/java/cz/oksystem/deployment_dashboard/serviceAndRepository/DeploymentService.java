package cz.oksystem.deployment_dashboard.serviceAndRepository;

import cz.oksystem.deployment_dashboard.entity.Deployment;
import org.springframework.stereotype.Service;

@Service
public class DeploymentService {
  private final DeploymentRepository dr;

  public DeploymentService(DeploymentRepository dr) {
    this.dr = dr;
  }

  public Deployment save(Deployment deployment) {
    return dr.save(deployment);
  }
}
