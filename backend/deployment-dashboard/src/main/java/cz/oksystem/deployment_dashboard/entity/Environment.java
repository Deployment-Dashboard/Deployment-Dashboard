package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
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

  @OneToMany(fetch = FetchType.LAZY, mappedBy = "env", cascade = CascadeType.ALL)
  private final List<Release> releases = new ArrayList<>();


  public Environment() {}

  public Environment(App app, String name) {
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

  public List<Release> getReleases() { return releases; }

  // Setters
  public void setName(String name) {
    this.name = name;
  }

  public void setApp(App app) {
    this.app = app;
  }

  @Override
  public String toString() {
    return "Environment{" +
      "id=" + id +
      ", name='" + name + '\'' +
      ", app=" + app +
      ", releases=" + releases +
      '}';
  }

  public boolean hasRelease() {
    return !getReleases().isEmpty();
  }
}
