package cz.oksystem.deployment_dashboard.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

public class ErrorBody {
  private LocalDateTime timestamp;
  private int statusCode;
  private String message;
  private String details;
  private String path;
  private String suggestion;


  public ErrorBody() {}

  public ErrorBody(int statusCode, String message, String suggestion) {
    this(statusCode, message, "", "", suggestion);
  }

  public ErrorBody(int statusCode, String message, String details, String path, String suggestion) {
    this.statusCode = statusCode;
    this.message = message;
    this.details = details;
    this.timestamp = LocalDateTime.now();
    this.path = path;
    this.suggestion = suggestion;
  }

  // Getters
  public LocalDateTime getTimestamp() {
    return timestamp;
  }

  public int getStatusCode() {
    return statusCode;
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

  public String getSuggestion() {
    return suggestion;
  }

  // Setters
  public void setTimestamp(LocalDateTime timestamp) {
    this.timestamp = timestamp;
  }

  public void setStatusCode(int statusCode) {
    this.statusCode = statusCode;
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

  public void setSuggestion(String suggestion) {
    this.suggestion = suggestion;
  }

  // Factories
  public static ErrorBody getDefaultDataIntegrityViolationException() {
    return new ErrorBody(
      HttpStatus.CONFLICT.value(),
      DefaultErrorMessages.DATA_INTEGRITY_VIOLATION,
      "Make sure the keys are unique.");
  }

  public static ErrorBody getDefaultNotFoundException() {
    return new ErrorBody(
      HttpStatus.NOT_FOUND.value(),
      DefaultErrorMessages.NOT_FOUND,
      "Please check that the provided values are correct.");
  }

  public static ErrorBody getDefaultHttpMessageConversionException() {
    return new ErrorBody(
      HttpStatus.BAD_REQUEST.value(),
      DefaultErrorMessages.HTTP_MESSAGE_CONVERSION,
      "Please check that the required values are not blank or empty");
  }

  public static ErrorBody getDefaultPersistenceException() {
    return new ErrorBody(
      HttpStatus.UNPROCESSABLE_ENTITY.value(),
      DefaultErrorMessages.PERSISTENCE_EXCEPTION,
      "Please check that the provided values are correct.");
  }

  public String toJson() throws JsonProcessingException {
    ObjectMapper mapper = new ObjectMapper();
    mapper.registerModule(new JavaTimeModule());
    mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    return mapper.writeValueAsString(this);
  }

  static class DefaultErrorMessages {
    static final String DATA_INTEGRITY_VIOLATION = "Request violates data integrity.";
    static final String NOT_FOUND = "Requested resource could not be found.";
    static final String HTTP_MESSAGE_CONVERSION = "Received request could not be converted.";
    static final String PERSISTENCE_EXCEPTION = "Request data could not be persisted.";
  }
}
