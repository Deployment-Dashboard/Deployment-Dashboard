package cz.oksystem.deployment_dashboard;

import cz.oksystem.deployment_dashboard.entity.ErrorBody;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.EntityAdditionException;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.EntityDeletionOrArchivationException;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.EntityFetchException;
import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.EntityUpdateException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;


// TODO - custom response na NotFound, momentálně hází internal server error, protože nedokáže asociovat request k vyjimce
@ControllerAdvice
public class GlobalExceptionHandler {
  private HttpStatus getStatusCodeForException(Throwable ex) {
    return switch (ex.getClass().getSimpleName()) {
      case "DuplicateKeyException", "RecursiveAppParentingException", "DataIntegrityViolationException" -> HttpStatus.CONFLICT;
      case "NotManagedException" -> HttpStatus.NOT_FOUND;
      case "HttpMessageConversionException" -> HttpStatus.BAD_REQUEST;
      default -> HttpStatus.INTERNAL_SERVER_ERROR;
    };
  }

  @ExceptionHandler({EntityAdditionException.class, EntityUpdateException.class, EntityDeletionOrArchivationException.class, EntityFetchException.class})
  ResponseEntity<ErrorBody> handleException(HttpServletRequest request, Exception ex) {
    Throwable cause = ex.getCause();
    HttpStatus status = getStatusCodeForException(cause);

    ErrorBody body = new ErrorBody(status, ex.getMessage(), cause.getMessage(), request.getRequestURI());

    return new ResponseEntity<>(body, status);
  }
}
