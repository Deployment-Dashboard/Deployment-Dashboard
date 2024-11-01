package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.springframework.lang.Nullable;

import java.time.LocalDateTime;

@Entity
@Table(name = "deployments", uniqueConstraints = @UniqueConstraint(columnNames = {"env", "version"}))
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
  @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
  @JoinColumn(name = "env_id")
  private Environment env;

  @JsonBackReference
  @NotNull
  @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
  @JoinColumn(name = "version_id")
  private Version version;

  public Deployment() {}

  public Deployment(Environment env, Version version) {
    this(null, env, version);
  }

  public Deployment(String jiraUrl, Environment env, Version version) {
    this(null, jiraUrl, env, version);
  }

  public Deployment(LocalDateTime date, String jiraUrl, Environment env, Version version) {
    this.date = date;
    this.jiraUrl = jiraUrl;
    this.env = env;
    this.version = version;
  }

  @Override
  public String toString() {
    return "Deployment{" +
      "id=" + id +
      ", date=" + date +
      ", jiraUrl='" + jiraUrl + '\'' +
      ", env=" + env +
      ", version=" + version +
      '}';
  }

  // Getters
  @Nullable
  public LocalDateTime getDate() {
    return date;
  }

  @Nullable
  public String getJiraUrl() {
    return jiraUrl;
  }

  public Environment getEnv() {
    return env;
  }

  public Version getVersion() {
    return version;
  }

  // Setters

  public void setDate(@Nullable LocalDateTime date) {
    this.date = date;
  }

  public void setJiraUrl(@Nullable String jiraUrl) {
    this.jiraUrl = jiraUrl;
  }

  public void setEnv(Environment env) {
    this.env = env;
  }

  public void setVersion(Version ver) {
    this.version = ver;
  }
}
