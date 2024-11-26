package cz.oksystem.deployment_dashboard.exceptions;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

public class ErrorBody {

  private LocalDateTime timestamp;
  private HttpStatus statusCode;
  private String message;
  private String details;
  private String path;


  public ErrorBody() {}

  public ErrorBody(HttpStatus statusCode, String message, String details, String path) {
    this(statusCode, message, details, LocalDateTime.now(), path);
  }

  public ErrorBody(HttpStatus statusCode, String message, String details, LocalDateTime timestamp, String path) {
    this.statusCode = statusCode;
    this.message = message;
    this.details = details;
    this.timestamp = timestamp;
    this.path = path;
  }

  // Getters
  public LocalDateTime getTimestamp() {
    return this.timestamp;
  }

  public HttpStatus getStatusCode() {
    return this.statusCode;
  }

  @JsonProperty("statusCode")
  public int getStatusCodeValue() {
    return this.statusCode.value();
  }

  public String getMessage() {
    return this.message;
  }

  public String getDetails() {
    return this.details;
  }

  public String getPath() {
    return this.path;
  }


  // Setters
  public void setTimestamp(LocalDateTime newTimestamp) {
    this.timestamp = newTimestamp;
  }

  public void setStatusCode(HttpStatus newStatusCode) {
    this.statusCode = newStatusCode;
  }

  @JsonSetter("statusCode")
  public void setStatusCode(int newStatusCode) {
    this.statusCode = HttpStatus.valueOf(newStatusCode);
  }

  public void setMessage(String newMessage) {
    this.message = newMessage;
  }

  public void setDetails(String newDetails) {
    this.details = newDetails;
  }

  public void setPath(String newPath) {
    this.path = newPath;
  }
}
