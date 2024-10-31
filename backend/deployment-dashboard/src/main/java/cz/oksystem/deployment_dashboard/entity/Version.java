package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "versions", uniqueConstraints = @UniqueConstraint(columnNames = {"name", "app"}))
public class Version {

  @Id
  @GeneratedValue
  @Column(name = "ver_id")
  private Long id;

  @NotEmpty
  @Column(name = "name")
  private String name;

  @Column(name = "desc")
  private String description = "";

  @CreationTimestamp
  private LocalDateTime createdAt;

  @JsonBackReference
  @NotNull
  @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
  @JoinColumn(name = "app")
  private App app;

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "ver", cascade = CascadeType.ALL)
  private final List<Deployment> deployments = new ArrayList<>();

  public Version() {}

  public Version(App app, String name) {
    this(app, name, "");
  }

  public Version(App app, String name, String description) {
    this.app = app;
    this.name = name;
    this.description = description;
  }

  // Getters
  public String getName() {
    return name;
  }

  public String getDescription() {
    return description;
  }

  public App getApp() {
    return app;
  }

  // Setters

  public void addDeployment(Deployment deployment) {
    deployments.add(deployment);
  }

  public void removeDeployment(Deployment deployment) {
    deployments.remove(deployment);
  }

  @Override
  public String toString() {
    return "Version{" +
      "id=" + id +
      ", name='" + name + '\'' +
      ", description='" + description + '\'' +
      ", app=" + app +
      ", deployments=" + deployments +
      '}';
  }

  public void setApp(App app) {
    this.app = app;
  }
}
