package cz.oksystem.deployment_dashboard.exceptions;

import cz.oksystem.deployment_dashboard.entity.Deployment;
import org.springframework.dao.DataIntegrityViolationException;

public class CustomExceptions {
  public static class DuplicateKeyException extends DataIntegrityViolationException {
    public DuplicateKeyException(String entityClassName, String key) {
      super(String.format("%s s klíčem '%s' již existuje.", entityClassName, key));
    }

    public DuplicateKeyException(String entityClassName, String appKey, String entityKey) {
      super(String.format("%s s klíčem '%s' pro aplikaci '%s' již existuje.", entityClassName, entityKey, appKey));
    }
  }

  public static class RecursiveAppParentingException extends IllegalStateException {
    public RecursiveAppParentingException() {
      super("Meziaplikační vztah je cyklický.");
    }
  }

  public static class NotManagedException extends RuntimeException {
    public NotManagedException(String entityClassName, String key) {
      super(String.format("%s s klíčem '%s' není v evidenci.", entityClassName, key));
    }

    public NotManagedException(String ownerClassName, String ownedClassName, String ownerKey, String ownedKey) {
      super(String.format("%s s klíčem '%s' pro %s '%s' není v evidenci.", ownedClassName, ownedKey, getCzechDeclension(ownerClassName).toLowerCase(), ownerKey));
    }

    public NotManagedException(String versionName, String appKey, String envName) {
      super(String.format("Nasazení verze '%s' aplikace s klíčem '%s' na prostředí '%s' není v evidenci.", versionName, appKey, envName));
    }
  }

  public static class DeletionNotAllowedException extends DataIntegrityViolationException {
    public DeletionNotAllowedException(String entityClassName, String key) {
      super(String.format("%s s klíčem '%s' má nasazení.", entityClassName, key));
    }
  }

  public static class NoSuchAppComponentException extends IllegalArgumentException {
    public NoSuchAppComponentException(String parentKey, String componentKey) {
      super(String.format("Aplikace '%s' není komponentou '%s'.", componentKey, parentKey));
    }
  }

  public static class VersionRedeployException extends RuntimeException {
    public VersionRedeployException(Deployment deployment) {
      super(String.format("Aplikace '%s' ve verzi '%s' již byla na prostředí '%s' nasazena.",
        deployment.getVersion().getApp().getKey(),
        deployment.getVersion().getName(),
        deployment.getEnvironment().getName()));
    }
  }

  public static class VersionRollbackException extends RuntimeException {
    public VersionRollbackException(Deployment oldDeployment, Deployment newDeployment) {
      super(String.format("Aplikace '%s' je na prostředí '%s' nasazena ve verzi '%s', která je dle evidence novější, než právě nasazovaná verze '%s'.",
        oldDeployment.getVersion().getApp().getKey(),
        oldDeployment.getEnvironment().getName(),
        oldDeployment.getVersion().getName(),
        newDeployment.getVersion().getName()));
    }
  }

  public static class EntityAdditionException extends RuntimeException {
    public EntityAdditionException(String entityClassName, String key, Throwable cause) {
      super(String.format("%s%s se nepodařilo přidat.", getCzechDeclension(entityClassName), key.isEmpty() ? "" : String.format(" s klíčem '%s'", key)), cause);
    }
  }

  public static class EntityUpdateException extends RuntimeException {
    public EntityUpdateException(String entityClassName, String key, Throwable cause) {
      super(String.format("%s%s se nepodařilo aktualizovat.", getCzechDeclension(entityClassName), key.isEmpty() ? "" : String.format(" s klíčem '%s'", key)), cause);
    }
  }

  public static class EntityDeletionOrArchivationException extends RuntimeException {
    public EntityDeletionOrArchivationException(String entityClassName, String key, Throwable cause) {
      super(String.format("%s%s se nepodařilo archivovat/smazat.", getCzechDeclension(entityClassName), key.isEmpty() ? "" : String.format(" s klíčem '%s'", key)), cause);

    }
  }

  public static class EntityFetchException extends RuntimeException {
    public EntityFetchException(String entityClassName, Throwable cause) {
      super(entityClassName + getCzechNotFoundMessage(entityClassName), cause);
    }
  }

  public static class DeploymentEvidenceException extends RuntimeException {
    public DeploymentEvidenceException(Throwable cause) {
      super("Nasazení se nepodařilo zaevidovat.", cause);
    }
  }

  private static String getCzechNotFoundMessage(String className) {
    String nebyl = " nebyl";

    if (className.equals("Aplikace") || className.equals("Verze")) {
      return nebyl + "a nalezena.";
    }
    return nebyl + "o nalezeno.";
  }

  /**
   * Vraci zadane podstatne jmeno ve 4. padu
   */
  private static String getCzechDeclension(String entityClassName) {
    StringBuilder sb = new StringBuilder(entityClassName);

    if (entityClassName.equals("Aplikace") || entityClassName.equals("Verze")) {
      sb.setCharAt(entityClassName.length() - 1, 'i');

    }
    return sb.toString();
  }
}
