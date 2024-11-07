package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import org.springframework.lang.Nullable;

import java.time.LocalDateTime;
import java.util.*;

// TODO PRO CELÝ PROJEKT - custom anotace na kontrolu inicializace a rozchodit Lombok kvůli té kupě getterů

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
  @ManyToOne
  @JoinColumn(name = "parent_id")
  private App parent;

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "app")
  private final List<Environment> environments = new ArrayList<>();

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "app")
  private final List<Version> versions = new ArrayList<>();

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "parent")
  private final List<App> components = new ArrayList<>();


  public App() {}

  public App(String key, String name) {
    this(key, name, null);
  }

  public App(String key, String name, @Nullable App parent) {
    if (key == null || key.isEmpty()) {
      throw new IllegalArgumentException(
        "Key is empty."
      );
    }
    if (name == null || name.isEmpty()) {
      throw new IllegalArgumentException(
        "Name is empty."
      );
    }
    this.key = key;
    this.name = name;
    this.parent = parent;
  }

  // Getters
  public String getKey() { return this.key; }

  public String getName() { return this.name; }

  public Optional<LocalDateTime> getArchivedTimestamp() {
    return Optional.ofNullable(this.archivedTimestamp);
  }

  public Optional<App> getParent() {
    return Optional.ofNullable(this.parent);
  }

  public List<Environment> getEnvironments() {
    return this.parent == null
      ? Collections.unmodifiableList(this.environments)
      : this.parent.getEnvironments();
  }

  public List<Version> getVersions() {
    return Collections.unmodifiableList(this.versions);
  }

  public List<App> getComponents() {
    return Collections.unmodifiableList(this.components);
  }

  // Setters
  public void setKey(String newKey) {
    if (newKey == null || newKey.isEmpty()) {
      throw new IllegalArgumentException(
        "Key is empty."
      );
    }
    this.key = newKey.toLowerCase();
  }

  public void setName(String newName) {
    if (newName == null || newName.isEmpty()) {
      throw new IllegalArgumentException(
        "Name is empty."
      );
    }
    this.name = newName.toLowerCase();
  }

  public void setArchivedTimestamp(@Nullable LocalDateTime archivedTimestamp) {
    this.archivedTimestamp = archivedTimestamp;
  }

  public void setParent(@Nullable App newParent) {
    this.parent = newParent;
  }

  // List field accessors
  public void addEnvironment(Environment newEnvironment) {
    if (newEnvironment == null) {
      throw new IllegalArgumentException(
        "Environment is null."
      );
    }
    environments.add(newEnvironment);
  }

  public void removeEnvironment(Environment environmentToRemove) {
    this.environments.remove(environmentToRemove);
  }

  public void addVersion(Version newVersion) {
    if (newVersion == null) {
      throw new IllegalArgumentException(
        "Version is null."
      );
    }
    this.versions.add(newVersion);
  }

  public void removeVersion(Version versionToRemove) {
    this.versions.remove(versionToRemove);
  }

  public void addComponent(App newComponent) {
    if (newComponent == null) {
      throw new IllegalArgumentException(
        "Component is null."
      );
    }
    components.add(newComponent);
  }

  public void removeComponent(App componentToRemove) {
    this.components.remove(componentToRemove);
  }

  // Properties
  public boolean isComponent() {
    return this.parent != null;
  }

  public boolean hasDeployment() {
    for (Version ver : this.versions) {
      if (ver.hasDeployment()) {
        return true;
      }
    }
    return false;
  }

  public boolean hasCycle() {
    App slow = this, fast = this;

    while (slow != null && fast != null
      && fast.parent != null) {
      slow = slow.parent;
      fast = fast.parent.parent;

      if (slow == fast) {
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
