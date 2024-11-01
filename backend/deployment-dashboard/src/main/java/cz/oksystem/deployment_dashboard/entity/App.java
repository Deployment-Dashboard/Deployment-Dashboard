package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import org.springframework.lang.Nullable;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "apps")
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

  @Nullable
  private LocalDateTime archivedTimestamp;

  @JsonBackReference
  @Nullable
  @ManyToOne(cascade = CascadeType.ALL)
  @JoinColumn(name = "parent_id")
  private App parent;

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "app", cascade = CascadeType.REMOVE)
  private List<Environment> envs = new ArrayList<>();

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "app", cascade = CascadeType.REMOVE)
  private final List<Version> versions = new ArrayList<>();

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "parent", cascade = CascadeType.REMOVE)
  private final List<App> components = new ArrayList<>();


  public App() {}

  public App(String key, String name) {
    this(key, name, null, null);
  }

  public App(String key, String name, App parent) {
    this(key, name, parent, null);
  }

  public App(String key, String name, App parent, LocalDateTime archivedTimestamp) {
    if (key == null || key.isEmpty()) {
      throw new IllegalArgumentException("Key should not be empty.");
    }
    if (name == null || name.isEmpty()) {
      throw new IllegalArgumentException("Name should not be empty.");
    }
    if (this == parent) {
      throw new IllegalStateException("App cannot be a parent of itself.");
    }

    this.key = key;
    this.name = name;
    this.parent = parent;
    if (parent != null) {
      this.envs = parent.envs;
    }
    this.archivedTimestamp = archivedTimestamp;
  }

  // Getters
  public String getKey() { return key; }

  public String getName() { return name; }

  public Optional<App> getParent() { return Optional.ofNullable(parent); }

  public Optional<LocalDateTime> getArchivedTimestamp() { return Optional.ofNullable(archivedTimestamp); }

  public List<Version> getVersions() { return Collections.unmodifiableList(versions); }

  public List<Environment> getEnvs() { return Collections.unmodifiableList(envs); }

  public void addComponent(App app) {
    if (this == app) {
      throw new IllegalStateException("App cannot be a component of itself.");
    }
    components.add(app);
  }

  public void removeComponent(App app) {
    components.remove(app);
  }

  public void addEnvironment(Environment env) { envs.add(env); }

  public void removeEnvironment(Environment env) { envs.remove(env); }

  public void addVersion(Version version) { versions.add(version); }

  public void removeVersion(Version version) { versions.remove(version); }

  public List<App> getComponents() { return Collections.unmodifiableList(components); }

  // Setters
  public void setKey(String key) {
    if (key == null || key.isEmpty()) {
      throw new IllegalArgumentException("Key should not be empty.");
    }
    this.key = key.toLowerCase();
  }

  public void setName(String name) {
    if (name == null || name.isEmpty()) {
      throw new IllegalArgumentException("Name should not be empty.");
    }
    this.name = name.toLowerCase();
  }

  public void setParent(App parent) {
    if (this.parent != null) {
      parent.removeComponent(this);
    }
    this.parent = parent;
    if (parent != null) {
      parent.addComponent(this);
      this.envs = parent.envs;
    }
  }

  public void setArchivedTimestamp(LocalDateTime archivedTimestamp) { this.archivedTimestamp = archivedTimestamp; }

  public boolean isComponent() {
    return parent != null;
  }

  public boolean hasDeployment() {
    for (Environment env: envs) {
      if (env.hasDeployment()) {
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
      ", archivedTimestamp=" + archivedTimestamp +
      '}';
  }
}
