package cz.oksystem.deployment_dashboard.exceptions;

import cz.oksystem.deployment_dashboard.entity.App;
import org.springframework.dao.DataIntegrityViolationException;

public class CustomExceptions {
  public static class DuplicateKeyException extends DataIntegrityViolationException {
    public DuplicateKeyException(Class<App> entityClass, String key) {
      super(String.format("%s with key '%s' already exists.", entityClass.getSimpleName(), key));
    }

    public DuplicateKeyException(Class<?> entityClass, String appKey, String entityKey) {
      super(String.format("%s with key '%s' for App '%s' already exists.", entityClass.getSimpleName(), entityKey, appKey));
    }
  }

  public static class RecursiveAppParentingException extends IllegalStateException {
    public RecursiveAppParentingException() {
      super("App to app relationship forms a circle.");
    }
  }

  public static class NotManagedException extends RuntimeException {
    public NotManagedException(Class<?> entityClass, String key) {
      super(String.format("%s with key '%s' is not managed.", entityClass.getSimpleName(), key));
    }

    public NotManagedException(Class<?> ownerClass, Class<?> ownedClass, String ownerKey, String ownedKey) {
      super(String.format("%s with key '%s' for %s '%s' is not managed.", ownedClass.getSimpleName(), ownerClass.getSimpleName(), ownedKey, ownerKey));
    }
  }

  public static class DeletionNotAllowedException extends DataIntegrityViolationException {
    public DeletionNotAllowedException(Class<?> entityClass, String key) {
      super(String.format("%s with key '%s' has deployments.", entityClass.getSimpleName(), key));
    }
  }

  public static class NoSuchAppComponentException extends IllegalArgumentException {
    public NoSuchAppComponentException(String parentKey, String componentKey) {
      super(String.format("App '%s' is not a component of '%s'.", componentKey, parentKey));
    }
  }

  public static class EntityAdditionException extends RuntimeException {
    public EntityAdditionException(Class<?> entityClass, Throwable cause) {
      super(entityClass.getSimpleName() + " could not be added.", cause);
    }
  }

  public static class EntityUpdateException extends RuntimeException {
    public EntityUpdateException(Class<?> entityClass, Throwable cause) {
      super(entityClass.getSimpleName() + " could not be updated.", cause);
    }
  }

  public static class EntityDeletionOrArchivationException extends RuntimeException {
    public EntityDeletionOrArchivationException(Class<?> entityClass, Throwable cause) {
      super(entityClass.getSimpleName() + " could not be archived/deleted.", cause);
    }
  }

  public static class EntityFetchException extends RuntimeException {
    public EntityFetchException(Class<?> entityClass, Throwable cause) {
      super(entityClass.getSimpleName() + " could not be fetched.", cause);
    }
  }
}
