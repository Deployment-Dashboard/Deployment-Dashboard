package cz.oksystem.deployment_dashboard.dto;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.Optional;

public class AppDto {

  @NotBlank(message = "Key is blank.")
  private String key;

  @NotBlank(message = "Name is blank.")
  private String name;

  @Nullable
  private String parent;

  @Nullable
  private LocalDateTime deleted;


  public AppDto() {}

  public AppDto(String key, String name) {
    this(key, name, null, null);
  }

  public AppDto(String key, String name, String parent) {
    this(key, name, parent, null);
  }

  public AppDto(String key, String name, String parent, LocalDateTime deleted) {
    this.key = key;
    this.name = name;
    this.parent = parent;
    this.deleted = deleted;
  }

  // Getters
  public String getKey() { return key; }

  public String getName() { return name; }

  public Optional<String> getParent() { return Optional.ofNullable(parent); }

  public Optional<LocalDateTime> getDeleted() { return Optional.ofNullable(deleted); }

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
