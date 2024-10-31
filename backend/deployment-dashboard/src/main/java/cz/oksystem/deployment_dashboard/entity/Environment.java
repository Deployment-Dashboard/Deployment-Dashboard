package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "envs", uniqueConstraints = @UniqueConstraint(columnNames = {"app", "name"}))
public class Environment {

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
  @JoinColumn(name = "app")
  private App app;

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "env", cascade = CascadeType.REMOVE)
  private final List<Deployment> deployments = new ArrayList<>();


  public Environment() {}

  public Environment(App app, String name) {
    if (app == null) {
      throw new IllegalArgumentException("App should not be empty.");
    }
    if (name == null || name.isEmpty()) {
      throw new IllegalArgumentException("Name should not be empty.");
    }
    this.app = app;
    this.name = name;
  }

  // Getters
  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public App getApp() {
    return app;
  }

  public List<Deployment> getDeployments() { return deployments; }

  // Setters
  public void setName(String name) {
    if (name == null || name.isEmpty()) {
      throw new IllegalArgumentException("Name should not be empty.");
    }
    this.name = name;
  }

  public void setApp(App app) {
    if (app == null) {
      throw new IllegalArgumentException("App should not be empty.");
    }
    this.app.removeEnvironment(this);
    this.app = app;
    app.addEnvironment(this);
  }

  public void addDeployment(Deployment deployment) {
    deployments.add(deployment);
  }

  public void removeDeployment(Deployment deployment) {
    deployments.remove(deployment);
  }

  @Override
  public String toString() {
    return "Environment{" +
      "id=" + id +
      ", name='" + name + '\'' +
      ", app=" + app +
      ", deployments=" + deployments +
      '}';
  }

  public boolean hasDeployment() {
    return !deployments.isEmpty();
  }
}
