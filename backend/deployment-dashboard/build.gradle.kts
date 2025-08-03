plugins {
  idea
	java
  application
	id("org.springframework.boot") version "3.2.9"
	id("io.spring.dependency-management") version "1.1.6"
}

group = "cz.oksystem"
project.version = System.getenv("releaseAppVersion")?.takeIf { it.isNotBlank() } ?: "DEVELOPMENT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-web")
  implementation("org.springframework.boot:spring-boot-starter-validation")
  implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")
  implementation("org.liquibase:liquibase-core")

  // dočasná db
	runtimeOnly("com.h2database:h2")

	testImplementation("org.springframework.boot:spring-boot-starter-test")

	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
	useJUnitPlatform()
}

// Application
application {
  mainClass.set("cz.oksystem.deployment_dashboard.DeploymentDashboardApplication")
  applicationDefaultJvmArgs = listOf(
    "-Dfile.encoding=utf-8",
    "-Dsun.jnu.encoding=utf-8",
    "-Duser.country=CZ",
    "-Duser.language=cs",
    "-Duser.timezone=Europe/Prague",
    "--add-opens", "java.base/java.lang=ALL-UNNAMED",
  )
}

// do vysledného archivu nezahrnovat root dir s nazvem projektu, ale rovnou adresare bin a lib
distributions["main"].contents.into("/")
// https://github.com/spring-projects/spring-boot/issues/38470#issuecomment-1821241590
tasks.withType<JavaCompile>().configureEach {
  options.compilerArgs.add("-parameters")
}
// kvuli ceskym znakum
tasks.named<JavaCompile>("compileJava").configure {
  options.encoding = "UTF-8"
}
// bootDist tary a zipy nepotrebujeme
tasks.named("bootDistTar") {
  enabled = false
}

tasks.named("bootDistZip") {
  enabled = false
}

tasks.named("distZip") {
  enabled = false
}
