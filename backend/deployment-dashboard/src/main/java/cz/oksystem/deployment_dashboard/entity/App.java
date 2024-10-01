package cz.oksystem.deployment_dashboard.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
  name = "apps")
//,
//  indexes = @Index(
//    name = "unique_not_deleted",
//    columnList = "app_key",
//    unique = true))
public class App {

  @Id
  @GeneratedValue
  @Column(name = "app_id")
  private Long id;

  @NotBlank
  @Column(name = "app_key", unique = true)
  private String key;

  @NotBlank
  private String name;

  private LocalDateTime deleted;

  @ManyToOne
  @JoinColumn(name = "parent_id")
  private App parent;

  @OneToMany(fetch = FetchType.LAZY, mappedBy = "app", cascade = CascadeType.ALL)
  private List<Environment> envs;

  @OneToMany(fetch = FetchType.LAZY, mappedBy = "app", cascade = CascadeType.ALL)
  private List<Version> versions;

  @OneToMany(fetch = FetchType.LAZY, mappedBy = "parent", cascade = CascadeType.ALL)
  private List<App> components;


  // Getters
  public long getId() {
    return id;
  }

  public String getKey() {
    return key;
  }

  public String getName() {
    return name;
  }

  public App getParent() {
    return parent;
  }

  public LocalDateTime getDeleted() { return deleted; }

  public List<Version> getVersions() { return versions; }

  public List<Environment> getEnvs() { return envs; }

  public List<App> getComponents() { return components; }

  // Setters
  public void setKey(String key) {
    this.key = key;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setParent(App parent) { this.parent = parent; }

  public void setDeleted(LocalDateTime deleted) {
    this.deleted = deleted;
  }

  public boolean hasRelease() {
    for (Environment env: envs) {
      if (!env.getReleases().isEmpty()) {
        return true;
      }
    }
    return false;
  }

  @Override
  public String toString() {
    return "App{" +
      "id=" + id +
      ", key='" + key + '\'' +
      ", name='" + name + '\'' +
      ", parent='" + parent + '\'' +
      ", deleted=" + deleted +
      '}';
  }
}
