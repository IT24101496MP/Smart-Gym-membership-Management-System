package lk.fat2fit.Fat2Fit.Config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // Public auth endpoints
                        .requestMatchers(HttpMethod.POST,
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/logout",
                                "/api/client/register",
                                "/api/instructor/register")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/membership-plans/active").permitAll()

                        // Authenticated-only
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()

                        // ADMIN only
                        .requestMatchers(HttpMethod.GET, "/api/instructor").hasRole("ADMIN")
                        .requestMatchers("/api/user/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/membership-plans").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/membership-plans").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/membership-plans/renew").hasAnyRole("ADMIN", "INSTRUCTOR", "CLIENT")
                        .requestMatchers(HttpMethod.GET, "/api/membership-plans/history/**").hasAnyRole("ADMIN", "INSTRUCTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/membership-plans/**").hasRole("ADMIN")

                        // Manage endpoints
                        .requestMatchers(HttpMethod.GET, "/api/manage/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/manage/users/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/manage/clients").hasAnyRole("ADMIN", "INSTRUCTOR")
                        // Personal details edit: ADMIN only
                        .requestMatchers(HttpMethod.PUT, "/api/manage/clients/*/metrics")
                        .hasAnyRole("ADMIN", "INSTRUCTOR")
                        .requestMatchers(HttpMethod.GET, "/api/manage/clients/*/metrics")
                        .hasAnyRole("ADMIN", "INSTRUCTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/manage/clients/**").hasRole("ADMIN")
                        .requestMatchers("/api/manage/me").authenticated()

                        // ADMIN or INSTRUCTOR
                        .requestMatchers(HttpMethod.GET, "/api/instructor/**").hasAnyRole("ADMIN", "INSTRUCTOR")

                        // Instructor mutating operations: ADMIN only
                        .requestMatchers(HttpMethod.PUT, "/api/instructor/**").hasRole("ADMIN")

                        // ADMIN or CLIENT
                        .requestMatchers("/api/client/**").hasAnyRole("ADMIN", "CLIENT")

                        // Everything else requires authentication
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173", "http://localhost:5174"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}