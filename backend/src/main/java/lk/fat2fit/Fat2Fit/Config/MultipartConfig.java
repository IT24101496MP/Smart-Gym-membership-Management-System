package lk.fat2fit.Fat2Fit.Config;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

@Configuration
public class MultipartConfig {

    @Bean
    public MultipartConfigElement multipartConfigElement() {
        return new MultipartConfigElement(
                "",                         // Location for temp files (empty uses default)
                DataSize.ofMegabytes(50).toBytes(), // maxRequestSize
                DataSize.ofMegabytes(50).toBytes(), // maxFileSize
                (int) DataSize.ofMegabytes(1).toBytes() // fileSizeThreshold
        );
    }
}