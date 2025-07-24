package cz.oksystem.deployment_dashboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DeploymentDashboardApplication {

  public static final String APP_PREFIX = "deploydash";

	public static void main(String[] args) {
		SpringApplication.run(DeploymentDashboardApplication.class, args);
	}
}
