package cz.oksystem.deployment_dashboard;

import com.fasterxml.jackson.core.JsonProcessingException;
import cz.oksystem.deployment_dashboard.entity.ErrorBody;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<String> conflict(HttpServletRequest request, DataIntegrityViolationException ex) throws JsonProcessingException {
    ErrorBody body = ErrorBody.getDefaultDataIntegrityViolationException();
    body.setDetails(ex.getMessage());
    body.setPath(request.getRequestURI());

    return new ResponseEntity<>(body.toJson(), HttpStatus.CONFLICT);
  }

  @ExceptionHandler(NotFoundException.class)
  ResponseEntity<String> notFoundException(HttpServletRequest request, NotFoundException ex) throws JsonProcessingException {
    ErrorBody body = ErrorBody.getDefaultNotFoundException();
    body.setDetails(ex.getMessage());
    body.setPath(request.getRequestURI());

    return new ResponseEntity<>(body.toJson(), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(HttpMessageConversionException.class)
  ResponseEntity<String> messageConversionException(HttpServletRequest request, HttpMessageConversionException ex) throws JsonProcessingException {
    ErrorBody body = ErrorBody.getDefaultHttpMessageConversionException();
    body.setDetails(ex.getMessage());
    body.setPath(request.getRequestURI());

    return new ResponseEntity<>(body.toJson(), HttpStatus.BAD_REQUEST);
  }
}
