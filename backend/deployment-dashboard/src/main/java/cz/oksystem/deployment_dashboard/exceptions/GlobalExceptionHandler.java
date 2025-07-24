package cz.oksystem.deployment_dashboard.exceptions;

import cz.oksystem.deployment_dashboard.exceptions.CustomExceptions.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;

import static cz.oksystem.deployment_dashboard.DeploymentDashboardApplication.APP_PREFIX;


@ControllerAdvice
public class GlobalExceptionHandler {
  private HttpStatus getStatusCodeForException(Throwable ex) {
    return switch (ex.getClass().getSimpleName()) {
      case "DuplicateKeyException", "RecursiveAppParentingException", "DeletionNotAllowedException" -> HttpStatus.CONFLICT;
      case "NotManagedException" -> HttpStatus.NOT_FOUND;
      case "HttpMessageConversionException", "VersionRedeployException", "VersionRollbackException" -> HttpStatus.BAD_REQUEST;
      default -> HttpStatus.INTERNAL_SERVER_ERROR;
    };
  }

  @ExceptionHandler({
    EntityAdditionException.class,
    EntityUpdateException.class,
    EntityDeletionOrArchivationException.class,
    EntityFetchException.class,
    DeploymentEvidenceException.class})
  ResponseEntity<CustomResponseBody> handleException(HttpServletRequest request, Exception ex) throws MalformedURLException, URISyntaxException {
    Throwable cause = ex.getCause();
    HttpStatus status = getStatusCodeForException(cause);

    URL forcedDeploymentUrl = null;

    if (ex.getClass().getSimpleName().equals("DeploymentEvidenceException")) {
      forcedDeploymentUrl = this.getForcedDeploymentUrl(request);
    }

    CustomResponseBody body = new CustomResponseBody(status, ex.getMessage(), cause.getMessage(), request.getRequestURI(), forcedDeploymentUrl);

    return new ResponseEntity<>(body, status);
  }

  private URL getForcedDeploymentUrl(HttpServletRequest request) throws URISyntaxException, MalformedURLException {
    StringBuilder requestUrl = new StringBuilder(request.getRequestURL().toString());

    String apiPathSegment = "/" + APP_PREFIX + "/api";
    int indexOfApiPathSegment = requestUrl.indexOf(apiPathSegment);

    requestUrl.replace(indexOfApiPathSegment, indexOfApiPathSegment + apiPathSegment.length(), apiPathSegment + "/force");

    String queryString = request.getQueryString();
    if (queryString != null) {
      requestUrl.append("?").append(queryString);
    }
    return new URI(requestUrl.toString()).toURL();
  }
}
