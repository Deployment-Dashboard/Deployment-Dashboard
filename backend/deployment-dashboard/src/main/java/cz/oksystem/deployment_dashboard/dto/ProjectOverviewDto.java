package cz.oksystem.deployment_dashboard.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ProjectOverviewDto {

  private String key;

  private String name;

  private LocalDateTime lastDeployedAt;

  private String lastDeployedVersionName;

  private String lastDeployedToEnvName;

  private String lastDeploymentJiraUrl;

  private List<String> versionedComponentsNames = new ArrayList<>();

  public ProjectOverviewDto() {}

  public ProjectOverviewDto(String key, String name) {
    this(key, name, null, null, null, null, new ArrayList<>());
  }

  public ProjectOverviewDto(String key, String name, LocalDateTime lastDeployedAt, String lastDeployedVersionName, String lastDeployedToEnvName, String lastDeploymentJiraUrl, List<String> versionedComponentsNames) {
    this.key = key;
    this.name = name;
    this.lastDeployedAt = lastDeployedAt;
    this.lastDeployedVersionName = lastDeployedVersionName;
    this.lastDeployedToEnvName = lastDeployedToEnvName;
    this.lastDeploymentJiraUrl = lastDeploymentJiraUrl;
    this.versionedComponentsNames = versionedComponentsNames;
  }

  // Getters
  public String getKey() {
    return key;
  }

  public String getName() {
    return name;
  }

  public LocalDateTime getLastDeployedAt() {
    return lastDeployedAt;
  }

  public String getLastDeployedVersionName() {
    return lastDeployedVersionName;
  }

  public String getLastDeployedToEnvName() { return lastDeployedToEnvName; }

  public String getLastDeploymentJiraUrl() { return lastDeploymentJiraUrl; }

  public List<String> getVersionedComponentsNames() { return List.copyOf(versionedComponentsNames); }

  // Setters
  public void setKey(String key) {
    this.key = key;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setLastDeployedAt(LocalDateTime lastDeployedAt) { this.lastDeployedAt = lastDeployedAt; }

  public void setLastDeployedVersionName(String lastDeployedVersionName) { this.lastDeployedVersionName = lastDeployedVersionName; }

  public void setLastDeployedToEnvName(String lastDeployedToEnvName) { this.lastDeployedToEnvName = lastDeployedToEnvName; }

  public void setLastDeploymentJiraUrl(String lastDeploymentJiraUrl) { this.lastDeploymentJiraUrl = lastDeploymentJiraUrl; }

  public void setVersionedComponentsNames(List<String> versionedComponentsNames) { this.versionedComponentsNames = versionedComponentsNames; }
}
