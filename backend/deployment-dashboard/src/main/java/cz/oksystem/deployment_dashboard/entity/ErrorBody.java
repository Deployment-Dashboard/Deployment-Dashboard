package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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
    return timestamp;
  }

  public HttpStatus getStatusCode() {
    return statusCode;
  }

  @JsonProperty("statusCode")
  public int getStatusCodeValue() {
    return statusCode.value();
  }

  public String getMessage() {
    return message;
  }

  public String getDetails() {
    return details;
  }

  public String getPath() {
    return path;
  }


  // Setters
  public void setTimestamp(LocalDateTime timestamp) {
    this.timestamp = timestamp;
  }

  public void setStatusCode(HttpStatus statusCode) {
    this.statusCode = statusCode;
  }

  @JsonSetter("statusCode")
  public void setStatusCode(int statusCode) {
    this.statusCode = HttpStatus.valueOf(statusCode);
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public void setDetails(String details) {
    this.details = details;
  }

  public void setPath(String path) {
    this.path = path;
  }

  public String toJson() throws JsonProcessingException {
    ObjectMapper mapper = new ObjectMapper();
    mapper.registerModule(new JavaTimeModule());
    mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    return mapper.writeValueAsString(this);
  }
}
