package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import org.springframework.lang.Nullable;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "apps", uniqueConstraints = @UniqueConstraint(columnNames = {"app_key", "archived_timestamp"}))
public class App {
  public static final String CZECH_NAME = "Aplikace";

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
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "app", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private final List<Environment> environments = new ArrayList<>();

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "app", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private final List<Version> versions = new ArrayList<>();

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "parent", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private final List<App> components = new ArrayList<>();


  public App() {}

  public App(String key, String name) {
    this(key, name, null);
  }

  public App(String key, String name, @Nullable App parent) {
    this(key, name, parent, null);
  }

  public App(String key, String name, @Nullable App parent, @Nullable LocalDateTime archivedTimestamp) {
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
    this.archivedTimestamp = archivedTimestamp;
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

  public List<App> getDirectComponents() {
    return Collections.unmodifiableList(this.components);
  }

  public List<App> getComponents() {
    List<App> components = new ArrayList<>();

    Queue<App> appQueue = new LinkedList<>();

    appQueue.add(this);

    while (appQueue.peek() != null)
    {
      App app = appQueue.poll();
      if (!components.contains(app)) {
        components.add(app);
        appQueue.addAll(app.getDirectComponents());
      }
    }
    components.remove(this);

    return components;
  }

  public List<Deployment> getDeployments() {
    List<Deployment> deployments = new ArrayList<>();

    for (Version version : this.getVersions()) {
      deployments.addAll(version.getDeployments());
    }

    return deployments;
  }

  // Setters
  public void setKey(String newKey) {
    if (newKey == null || newKey.isEmpty()) {
      throw new IllegalArgumentException(
        "Key is empty."
      );
    }
    this.key = newKey;
  }

  public void setName(String newName) {
    if (newName == null || newName.isEmpty()) {
      throw new IllegalArgumentException(
        "Name is empty."
      );
    }
    this.name = newName;
  }

  public void setArchivedTimestamp(@Nullable LocalDateTime newArchivedTimestamp) {
    this.archivedTimestamp = newArchivedTimestamp;
  }

  public void setParent(@Nullable App newParent) {
    this.parent = newParent;
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
