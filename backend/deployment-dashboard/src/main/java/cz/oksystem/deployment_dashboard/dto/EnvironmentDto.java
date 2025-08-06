package cz.oksystem.deployment_dashboard.dto;

import jakarta.validation.constraints.NotBlank;
//
public class EnvironmentDto {

  @NotBlank(message = "Pole 'name' je prázdné.")
  private String name;

  @NotBlank(message = "Pole 'appKey' je prázdné.")
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
