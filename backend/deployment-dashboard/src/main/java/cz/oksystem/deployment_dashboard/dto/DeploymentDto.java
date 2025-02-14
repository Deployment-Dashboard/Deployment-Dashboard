package cz.oksystem.deployment_dashboard.dto;

import java.time.LocalDateTime;

public class DeploymentDto {
  private LocalDateTime deployedAt;

  private String appKey;

  private String appName;

  private String environmentName;

  private String versionName;

  private String jiraUrl;

  public DeploymentDto() {}

  public DeploymentDto(LocalDateTime deployedAt, String appKey, String appName, String environmentName, String versionName, String jiraUrl) {
    this.deployedAt = deployedAt;
    this.appKey = appKey;
    this.appName = appName;
    this.environmentName = environmentName;
    this.versionName = versionName;
    this.jiraUrl = jiraUrl;
  }

  public LocalDateTime getDeployedAt() {
    return deployedAt;
  }

  public String getAppKey() {
    return appKey;
  }

  public String getAppName() {
    return appName;
  }

  public String getEnvironmentName() {
    return environmentName;
  }

  public String getVersionName() {
    return versionName;
  }

  public String getJiraUrl() {
    return jiraUrl;
  }

  public void setDeployedAt(LocalDateTime deployedAt) {
    this.deployedAt = deployedAt;
  }

  public void setAppKey(String appKey) {
    this.appKey = appKey;
  }

  public void setAppName(String appName) {
    this.appName = appName;
  }

  public void setEnvironmentName(String environmentName) {
    this.environmentName = environmentName;
  }

  public void setVersionName(String versionName) {
    this.versionName = versionName;
  }

  public void setJiraUrl(String jiraUrl) {
    this.jiraUrl = jiraUrl;
  }
}
