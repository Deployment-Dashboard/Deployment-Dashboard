package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.FetchType;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;


@MappedSuperclass
public abstract class AbstractDeploymentHolder {

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.REMOVE, orphanRemoval = true)
  protected List<Deployment> deployments = new ArrayList<>();


  // Getters
  public List<Deployment> getDeployments() {
    return Collections.unmodifiableList(this.deployments);
  }

  // Properties
  public boolean hasDeployment() {
    return !this.deployments.isEmpty();
  }
}
