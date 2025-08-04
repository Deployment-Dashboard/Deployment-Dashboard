package cz.oksystem.deployment_dashboard.dto;

import org.springframework.lang.Nullable;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.Optional;

public class AppDto {

  // chang
  @NotBlank(message = "Pole 'key' je prázdné.")
  private String key;

  @NotBlank(message = "Pole 'name' je prázdné.")
  private String name;

  @Nullable
  private String parentKey;

  @Nullable
  private LocalDateTime archivedTimestamp;


  public AppDto() {}

  public AppDto(String key, String name) {
    this(key, name, null, null);
  }

  public AppDto(String key, String name, String parent) {
    this(key, name, parent, null);
  }

  public AppDto(String key, String name, @Nullable String parentKey, @Nullable LocalDateTime archivedTimestamp) {
    this.key = key;
    this.name = name;
    this.parentKey = parentKey;
    this.archivedTimestamp = archivedTimestamp;
  }

  // Getters
  public String getKey() { return this.key; }

  public String getName() { return this.name; }

  public Optional<String> getParentKey() { return Optional.ofNullable(this.parentKey); }

  public Optional<LocalDateTime> getArchivedTimestamp() { return Optional.ofNullable(this.archivedTimestamp); }

  // Setters
  public void setKey(String newKey) {
    this.key = newKey;
  }

  public void setName(String newName) { this.name = newName; }

  public void setParentKey(@Nullable String newParentKey) { this.parentKey = newParentKey; }

  public void setArchivedTimestamp(@Nullable LocalDateTime newArchivedTimestamp) { this.archivedTimestamp = newArchivedTimestamp; }
}
