package cz.oksystem.deployment_dashboard.dto;

import jakarta.validation.constraints.NotBlank;

public class EnvironmentDto {

  @NotBlank(message = "Name is blank.")
  private String name;

  @NotBlank(message = "App key is blank.")
  private String appKey;


  public EnvironmentDto() {}

  public EnvironmentDto(String appKey, String name) {
    this.appKey = appKey;
    this.name = name;
  }

  // Getters
  public String getName() {
    return name;
  }

  public String getAppKey() {
    return appKey;
  }

  // Setters
  public void setName(String name) {
    this.name = name;
  }

  public void setAppKey(String appKey) {
    this.appKey = appKey;
  }
}
