package cz.oksystem.deployment_dashboard.exceptions;

import org.springframework.dao.DataIntegrityViolationException;

public class CustomExceptions {
  public static class DuplicateKeyException extends DataIntegrityViolationException {
    public DuplicateKeyException(Class<?> entityClass, String key) {
      super(String.format("%s with key '%s' already exists.", entityClass.getSimpleName(), key));
    }
  }

  public static class RecursiveAppParentingException extends IllegalStateException {
    public RecursiveAppParentingException() {
      super("App cannot be a parent of itself.");
    }
  }

  public static class NotManagedException extends RuntimeException {
    public NotManagedException(Class<?> entityClass, String key) {
      super(String.format("%s with key '%s' is not managed.", entityClass.getSimpleName(), key));
    }
  }

  public static class ParentingTooDeepException extends IllegalStateException {
    public ParentingTooDeepException() { super("Only one level of parenting is allowed for apps."); }
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
