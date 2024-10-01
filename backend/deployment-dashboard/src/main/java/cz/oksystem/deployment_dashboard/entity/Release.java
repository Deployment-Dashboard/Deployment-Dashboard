package cz.oksystem.deployment_dashboard.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;

import java.sql.Date;

@Entity
@Table(name = "releases")
public class Release {

  @Id
  @GeneratedValue
  private Long id;

  @Column(name = "date")
  private Date date;

  @Column(name = "jira_url")
  private String jiraUrl;

  @NotEmpty
  @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
  @JoinColumn(name = "env_id")
  private Environment env;

  @NotEmpty
  @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
  @JoinColumn(name = "ver_id")
  private Version ver;
}
