package lk.fat2fit.Fat2Fit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class Fat2FitApplication {

	public static void main(String[] args) {
		SpringApplication.run(Fat2FitApplication.class, args);
	}

}
