package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "envs", uniqueConstraints = @UniqueConstraint(columnNames = {"app_id", "name"}))
@AssociationOverride(name = "deployments", joinColumns = @JoinColumn(name = "env_id"))
public class Environment extends AbstractDeploymentHolder {

  @Id
  @GeneratedValue
  @Column(name = "env_id")
  private Long id;
  
  @NotBlank
  @Column(name = "name")
  private String name;

  @JsonBackReference
  @NotNull
  @ManyToOne
  @JoinColumn(name = "app_id")
  private App app;


  public Environment() {}

  public Environment(String name, App app) {
    if (app == null) {
      throw new IllegalArgumentException(
        "App is null."
      );
    }
    if (name == null || name.isEmpty()) {
      throw new IllegalArgumentException(
        "Name is empty."
      );
    }
    this.app = app;
    this.name = name;
  }

  // Getters
  public String getName() { return this.name; }

  public App getApp() { return this.app; }

  // Setters
  public void setName(String newName) {
    if (newName == null || newName.isEmpty()) {
      throw new IllegalArgumentException(
        "Name is empty."
      );
    }
    this.name = newName;
  }

  public void setApp(App newApp) {
    if (newApp == null) {
      throw new IllegalArgumentException(
        "App is null."
      );
    }
    if (this.app != null) {
      throw new IllegalStateException(
        "Environment already assigned to an App."
      );
    }
    this.app = newApp;
  }

  @Override
  public String toString() {
    return "Environment{" +
      "id=" + id +
      ", name='" + name + '\'' +
      ", app=" + app +
      ", deployments=" + this.getDeployments() +
      '}';
  }
}
