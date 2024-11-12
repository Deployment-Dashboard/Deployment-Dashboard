package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.FetchType;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.OneToMany;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;


@MappedSuperclass
public abstract class AbstractDeploymentHolder {

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY)
  protected List<Deployment> deployments = new ArrayList<>();


  // Getters
  public List<Deployment> getDeployments() {
    return Collections.unmodifiableList(this.deployments);
  }

  // List field accessors
  public void addDeployment(Deployment newDeployment) {
    if (newDeployment == null) {
      throw new IllegalArgumentException(
        "Deployment is null."
      );
    }
    this.deployments.add(newDeployment);
  }

  public void removeDeployment(Deployment deploymentToRemove) {
    this.deployments.remove(deploymentToRemove);
  }

  // Properties
  public boolean hasDeployment() {
    return !this.deployments.isEmpty();
  }
}
