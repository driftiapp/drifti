package com.drifti.controller;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class FirebaseTestController {

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("OK");
    }

    @GetMapping("/test/firebase")
    public ResponseEntity<String> testFirebaseConnection() {
        try {
            // Check if Firebase is initialized
            if (FirebaseApp.getApps().isEmpty()) {
                return ResponseEntity.internalServerError().body("Firebase not initialized");
            }
            
            // Try to get Firebase Auth instance
            FirebaseAuth.getInstance();
            
            return ResponseEntity.ok("Firebase connection successful! ✅");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Firebase connection failed ❌: " + e.getMessage());
        }
    }
} 