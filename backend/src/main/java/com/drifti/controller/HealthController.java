package com.drifti.controller;

import com.google.firebase.FirebaseApp;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    @GetMapping
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        Map<String, Object> services = new HashMap<>();
        Map<String, Object> system = new HashMap<>();
        long startTime = System.currentTimeMillis();

        // Check Database
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            services.put("database", createHealthStatus(true, "Database connection successful"));
        } catch (Exception e) {
            services.put("database", createHealthStatus(false, "Database error: " + e.getMessage()));
        }

        // Check Firebase
        try {
            FirebaseApp.getInstance();
            services.put("firebase", createHealthStatus(true, "Firebase connection successful"));
        } catch (Exception e) {
            services.put("firebase", createHealthStatus(false, "Firebase error: " + e.getMessage()));
        }

        // System Information
        Runtime runtime = Runtime.getRuntime();
        Properties props = System.getProperties();
        
        system.put("memory", Map.of(
            "total", runtime.totalMemory(),
            "free", runtime.freeMemory(),
            "max", runtime.maxMemory()
        ));
        
        system.put("cpu", Map.of(
            "processors", runtime.availableProcessors()
        ));
        
        system.put("java", Map.of(
            "version", props.getProperty("java.version"),
            "vendor", props.getProperty("java.vendor")
        ));
        
        system.put("os", Map.of(
            "name", props.getProperty("os.name"),
            "version", props.getProperty("os.version"),
            "arch", props.getProperty("os.arch")
        ));

        // Application Information
        Map<String, Object> app = new HashMap<>();
        app.put("profile", activeProfile);
        app.put("startTime", System.getProperty("sun.java.command"));
        app.put("workingDir", System.getProperty("user.dir"));

        // Response time
        long responseTime = System.currentTimeMillis() - startTime;

        status.put("status", allServicesHealthy(services) ? "UP" : "DEGRADED");
        status.put("services", services);
        status.put("system", system);
        status.put("application", app);
        status.put("timestamp", System.currentTimeMillis());
        status.put("responseTime", responseTime + "ms");

        return ResponseEntity.ok(status);
    }

    @GetMapping("/simple")
    public ResponseEntity<String> simpleHealthCheck() {
        return ResponseEntity.ok("OK");
    }

    private Map<String, Object> createHealthStatus(boolean healthy, String message) {
        return Map.of(
            "status", healthy ? "healthy" : "unhealthy",
            "message", message,
            "timestamp", System.currentTimeMillis()
        );
    }

    private boolean allServicesHealthy(Map<String, Object> services) {
        return services.values().stream()
            .map(service -> ((Map<String, Object>) service).get("status"))
            .allMatch("healthy"::equals);
    }
} 