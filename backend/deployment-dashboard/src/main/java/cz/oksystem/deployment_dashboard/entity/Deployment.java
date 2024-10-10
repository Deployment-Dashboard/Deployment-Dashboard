package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.springframework.lang.Nullable;

import java.sql.Date;

@Entity
@Table(name = "deployments", uniqueConstraints = @UniqueConstraint(columnNames = {"env", "ver"}))
public class Deployment {

  @Id
  @GeneratedValue
  private Long id;

  @Nullable
  @Column(name = "date")
  private Date date;

  @Nullable
  @Column(name = "jira_url")
  private String jiraUrl;

  @JsonBackReference
  @NotNull
  @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
  @JoinColumn(name = "env")
  private Environment env;

  @JsonBackReference
  @NotNull
  @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
  @JoinColumn(name = "ver")
  private Version ver;

  public Deployment() {}

  public Deployment(Environment env, Version ver) {
    this(null, env, ver);
  }

  public Deployment(String jiraUrl, Environment env, Version ver) {
    this(null, jiraUrl, env, ver);
  }

  public Deployment(Date date, String jiraUrl, Environment env, Version ver) {
    this.date = date;
    this.jiraUrl = jiraUrl;
    this.env = env;
    this.ver = ver;
  }

  @Override
  public String toString() {
    return "Deployment{" +
      "id=" + id +
      ", date=" + date +
      ", jiraUrl='" + jiraUrl + '\'' +
      ", env=" + env +
      ", ver=" + ver +
      '}';
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  @Nullable
  public Date getDate() {
    return date;
  }

  public void setDate(@Nullable Date date) {
    this.date = date;
  }

  @Nullable
  public String getJiraUrl() {
    return jiraUrl;
  }

  public void setJiraUrl(@Nullable String jiraUrl) {
    this.jiraUrl = jiraUrl;
  }

  public Environment getEnv() {
    return env;
  }

  public void setEnv(Environment env) {
    this.env = env;
  }

  public Version getVer() {
    return ver;
  }

  public void setVer(Version ver) {
    this.ver = ver;
  }
}
