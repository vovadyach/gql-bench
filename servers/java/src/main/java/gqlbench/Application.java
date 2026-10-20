// Spring Boot + Netflix DGS. One process on one core: the runner starts the JVM with
// -XX:ActiveProcessorCount=1, so request work runs on one virtual-thread carrier thread,
// like the single-threaded Node servers. Java would use every core by default.
package gqlbench;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}
