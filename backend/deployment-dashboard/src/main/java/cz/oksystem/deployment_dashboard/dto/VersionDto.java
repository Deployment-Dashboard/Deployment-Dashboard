package cz.oksystem.deployment_dashboard.dto;


import org.springframework.data.util.Pair;

import java.time.LocalDateTime;
import java.util.Map;

public class VersionDto {
  private Map<String, Pair<LocalDateTime, String>> environmentToDateAndJiraUrlMap;
  private String versionDescription;
  private Long id;
  private String name;

  public VersionDto() {};

  public VersionDto(Long id, String name, String versionDescription) {
    this(id, name, null, versionDescription);
  }

  public VersionDto(Long id, String name, Map<String, Pair<LocalDateTime, String>> environmentToDateAndJiraUrlMap, String versionDescription) {
    this.id = id;
    this.name = name;
    this.environmentToDateAndJiraUrlMap = environmentToDateAndJiraUrlMap;
    this.versionDescription = versionDescription;
  }

  public Long getId() {return id;}

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Map<String, Pair<LocalDateTime, String>> getEnvironmentToDateAndJiraUrlMap() {
    return environmentToDateAndJiraUrlMap;
  }

  public void setEnvironmentToDateAndJiraUrlMap(Map<String, Pair<LocalDateTime, String>> environmentToDateAndJiraUrlMap) {
    this.environmentToDateAndJiraUrlMap = environmentToDateAndJiraUrlMap;
  }

  public String getVersionDescription() {
    return versionDescription;
  }

  public void setVersionDescription(String versionDescription) {
    this.versionDescription = versionDescription;
  }
}
