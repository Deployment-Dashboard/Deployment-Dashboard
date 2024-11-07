package cz.oksystem.deployment_dashboard.repository;

import cz.oksystem.deployment_dashboard.entity.Deployment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeploymentRepository extends JpaRepository<Deployment, Long> {
}
