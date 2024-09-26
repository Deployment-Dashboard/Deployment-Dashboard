package cz.oksystem.deployment_dashboard.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

@Entity
@Table(name = "envs", uniqueConstraints = @UniqueConstraint(columnNames = {"app_id", "name"}))
public class Environment {

  @Id
  @GeneratedValue
  @Column(name = "env_id")
  private Long id;

  @NotEmpty
  @Column(name = "name")
  private String name;

  @NotEmpty
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "app_id")
  private App app;

  @OneToMany(fetch = FetchType.LAZY, mappedBy = "env", cascade = CascadeType.ALL)
  private List<Release> releases;

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

  // Setters
  public void setName(String name) {
    this.name = name;
  }

  public void setApp(App app) {
    this.app = app;
  }
}
