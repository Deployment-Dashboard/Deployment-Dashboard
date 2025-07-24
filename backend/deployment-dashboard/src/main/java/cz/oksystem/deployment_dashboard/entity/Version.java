package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import org.springframework.lang.Nullable;

import java.util.Optional;

@Entity
@Table(name = "versions", uniqueConstraints = @UniqueConstraint(columnNames = {"name", "app_id"}))
@AssociationOverride(name = "deployments", joinColumns = @JoinColumn(name = "version_id", updatable = false))
public class Version extends AbstractDeploymentHolder {

  public static final String CZECH_NAME = "Verze";

  @Id
  @GeneratedValue
  @Column(name = "version_id")
  private Long id;

  @NotEmpty
  @Column(name = "name")
  private String name;

  @Nullable
  @Column(name = "description")
  private String description;

  @JsonBackReference
  @NotNull
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "app_id", updatable = false)
  private App app;


  public Version() {}

  public Version(App app, String name) {
    this(app, name, null);
  }

  public Version(App app, String name, @Nullable String description) {
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
    this.description = description;
  }

  // Getters
  public String getName() { return this.name; }

  public Optional<String> getDescription() {
    return Optional.ofNullable(description);
  }

  public App getApp() { return this.app; }

  // Setters
  public void setName(String newName) {
    if (newName == null) {
      throw new IllegalArgumentException(
        "Name is null."
      );
    }
    this.name = newName;
  }

  public void setDescription(@Nullable String newDescription) {
    this.description = newDescription;
  }

  public void setApp(App newApp) {
    if (newApp == null) {
      throw new IllegalArgumentException(
        "App is null."
      );
    }
    if (this.app != null) {
      throw new IllegalStateException(
        "Version already assigned to an App."
      );
    }
    this.app = newApp;
  }

  @Override
  public String toString() {
    return "Version{" +
      "id=" + id +
      ", name='" + name + '\'' +
      ", description='" + description + '\'' +
      ", app=" + app +
      ", deployments=" + this.getDeployments() +
      '}';
  }

  public Long getId() {
    return this.id;
  }
}
