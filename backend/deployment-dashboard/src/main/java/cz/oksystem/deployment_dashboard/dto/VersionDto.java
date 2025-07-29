package cz.oksystem.deployment_dashboard.dto;


import jakarta.validation.constraints.NotBlank;
import org.springframework.data.util.Pair;

import java.time.LocalDateTime;
import java.util.Map;

public class VersionDto {
  private Map<String, Pair<LocalDateTime, String>> environmentToDateAndJiraUrlMap;
  private String description;
  private Long id;
  @NotBlank(message = "Pole 'name' je prázdné.")
  private String name;

  public VersionDto() {};

  public VersionDto(Long id, String name, String description) {
    this(id, name, null, description);
  }

  public VersionDto(Long id, String name, Map<String, Pair<LocalDateTime, String>> environmentToDateAndJiraUrlMap, String description) {
    this.id = id;
    this.name = name;
    this.environmentToDateAndJiraUrlMap = environmentToDateAndJiraUrlMap;
    this.description = description;
  }

  // Getters
  public Long getId() {return id;}

  public String getName() {
    return name;
  }

  public Map<String, Pair<LocalDateTime, String>> getEnvironmentToDateAndJiraUrlMap() {
    return environmentToDateAndJiraUrlMap;
  }

  public String getDescription() {
    return description;
  }

  // Setters
  public void setName(String name) {
    this.name = name;
  }

  public void setEnvironmentToDateAndJiraUrlMap(Map<String, Pair<LocalDateTime, String>> environmentToDateAndJiraUrlMap) {
    this.environmentToDateAndJiraUrlMap = environmentToDateAndJiraUrlMap;
  }

  public void setDescription(String description) {
    this.description = description;
  }
}
