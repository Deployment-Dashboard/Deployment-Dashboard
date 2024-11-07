package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.springframework.lang.Nullable;

import java.time.LocalDateTime;
import java.util.Optional;

@Entity
@Table(name = "deployments", uniqueConstraints = @UniqueConstraint(columnNames = {"env_id", "version_id"}))
public class Deployment {

  @Id
  @GeneratedValue
  @Column(name = "deployment_id")
  private Long id;

  @Nullable
  @Column(name = "date")
  private LocalDateTime date;

  @Nullable
  @Column(name = "jira_url")
  private String jiraUrl;

  @JsonBackReference
  @NotNull
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "env_id")
  private Environment environment;

  @JsonBackReference
  @NotNull
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "version_id")
  private Version version;


  public Deployment() {}

  public Deployment(Environment environment, Version version) {
    this(environment, version, null);
  }

  public Deployment(Environment environment, Version version, @Nullable String jiraUrl) {
    this(environment, version, jiraUrl, null);
  }

  public Deployment(Environment environment, Version version, @Nullable String jiraUrl, @Nullable LocalDateTime date) {
    if (environment == null) {
        throw new IllegalArgumentException(
          "Environment is null."
        );
    }
    if (version == null) {
        throw new IllegalArgumentException(
          "Version is null."
        );
    }
    this.date = date;
    this.jiraUrl = jiraUrl;
    this.environment = environment;
    this.version = version;
  }

  // Getters
  public Optional<LocalDateTime> getDate() {
    return Optional.ofNullable(this.date);
  }

  public Optional<String> getJiraUrl() {
    return Optional.ofNullable(this.jiraUrl);
  }

  public Environment getEnvironment() { return this.environment; }

  public Version getVersion() {
    return this.version;
  }

  // Setters
  public void setDate(@Nullable LocalDateTime newDate) {
    this.date = newDate;
  }

  public void setJiraUrl(@Nullable String newJiraUrl) {
    this.jiraUrl = newJiraUrl;
  }

  public void setEnvironment(Environment newEnvironment) {
    if (newEnvironment == null) {
      throw new IllegalArgumentException(
        "Environment is null."
      );
    }
    if (this.environment != null) {
      throw new IllegalStateException(
        "Deployment already assigned to an Environment."
      );
    }
    this.environment = newEnvironment;
  }

  public void setVersion(Version newVersion) {
    if (newVersion == null) {
      throw new IllegalArgumentException(
        "Version is null."
      );
    }
    if (this.version != null) {
      throw new IllegalStateException(
        "Deployment already assigned to a Version."
      );
    }
    this.version = newVersion;
  }

  @Override
  public String toString() {
    return "Deployment{" +
      "id=" + id +
      ", date=" + date +
      ", jiraUrl='" + jiraUrl + '\'' +
      ", environment=" + environment +
      ", version=" + version +
      '}';
  }
}
