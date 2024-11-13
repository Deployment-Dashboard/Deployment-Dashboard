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
    return this.name;
  }

  public String getAppKey() {
    return this.appKey;
  }

  // Setters
  public void setName(String newName) {
    this.name = newName;
  }

  public void setAppKey(String newAppKey) { this.appKey = newAppKey; }
}
