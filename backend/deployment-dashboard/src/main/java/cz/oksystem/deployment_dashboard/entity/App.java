package cz.oksystem.deployment_dashboard.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "apps")
public class App {

  @Id
  @GeneratedValue
  @Column(name = "app_id")
  private Long id;

  @NotEmpty
  @Column(name = "app_key", unique = true)
  private String key;

  @OneToMany(fetch = FetchType.LAZY, mappedBy = "app", cascade = CascadeType.ALL)
  private List<Environment> envs;

  @OneToMany(fetch = FetchType.LAZY, mappedBy = "app", cascade = CascadeType.ALL)
  private List<Version> versions;

  @NotEmpty
  private String name;

  private String parent;

  private LocalDateTime deleted;

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

  public String getParent() {
    return parent;
  }

  public LocalDateTime getDeleted() {
    return deleted;
  }

  // Setters
  public void setKey(String key) {
    this.key = key;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setParent(String parent) {
    this.parent = parent;
  }

  public void setDeleted(LocalDateTime deleted) {
    this.deleted = deleted;
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
