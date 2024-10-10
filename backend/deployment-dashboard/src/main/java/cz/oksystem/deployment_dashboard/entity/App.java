package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import org.springframework.lang.Nullable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

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
  private LocalDateTime deleted;

  @Nullable
  @ManyToOne
  @JoinColumn(name = "parent_id")
  private App parent;

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "app", cascade = CascadeType.ALL)
  private final List<Environment> envs = new ArrayList<>();

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "app", cascade = CascadeType.ALL)
  private final List<Version> versions = new ArrayList<>();

  @JsonManagedReference
  @OneToMany(fetch = FetchType.LAZY, mappedBy = "parent", cascade = CascadeType.ALL)
  private final List<App> components = new ArrayList<>();


  public App() {}

  public App(String key, String name) {
    this.key = key;
    this.name = name;
  }

  // Getters
  public String getKey() { return key; }

  public String getName() { return name; }

  public Optional<App> getParent() { return Optional.ofNullable(parent); }

  public Optional<LocalDateTime> getDeleted() { return Optional.ofNullable(deleted); }

  public List<Version> getVersions() { return Collections.unmodifiableList(versions); }

  public List<Environment> getEnvs() { return Collections.unmodifiableList(envs); }

  public List<App> getComponents() { return Collections.unmodifiableList(components); }

  // Setters
  public void setKey(String key) { this.key = key.toLowerCase(); }

  public void setName(String name) { this.name = name.toLowerCase(); }

  public void setParent(App parent) {
    if (this.parent != null ) {
      this.parent.components.remove(this);
    }
    this.parent = parent;
    if (parent != null) {
      parent.components.add(this);
    }
  }

  public void setDeleted(LocalDateTime deleted) { this.deleted = deleted; }

  public boolean hasDeployment() {
    for (Environment env: envs) {
      return env.hasDeployment();
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
