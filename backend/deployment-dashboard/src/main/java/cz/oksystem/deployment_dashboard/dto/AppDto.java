package cz.oksystem.deployment_dashboard.dto;

import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDateTime;

public class AppDto {

  @NotEmpty
  private String key;

  @NotEmpty
  private String name;

  private String parent;

  private LocalDateTime deleted;


  // Getters
  public String getKey() { return key; }

  public String getName() { return name; }

  public String getParent() { return parent; }

  public LocalDateTime getDeleted() { return deleted; }

  // Setters
  public void setKey(String key) { this.key = key; }

  public void setName(String name) { this.name = name; }

  public void setParent(String parent) { this.parent = parent; }

  public void setDeleted(LocalDateTime deleted) { this.deleted = deleted; }

  @Override
  public String toString() {
    return "AppDto{" +
      "key='" + key + '\'' +
      ", name='" + name + '\'' +
      ", parent='" + parent + '\'' +
      ", deleted=" + deleted +
      '}';
  }
}
