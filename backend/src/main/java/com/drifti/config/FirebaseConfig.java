package com.drifti.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import javax.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials.base64:#{null}}")
    private String firebaseCredentialsBase64;

    @Value("${firebase.database.url}")
    private String firebaseDatabaseUrl;

    @PostConstruct
    public void initialize() throws IOException {
        InputStream serviceAccount;
        
        if (firebaseCredentialsBase64 != null && !firebaseCredentialsBase64.isEmpty()) {
            // Use credentials from environment variable
            byte[] decodedCredentials = Base64.getDecoder().decode(firebaseCredentialsBase64);
            serviceAccount = new ByteArrayInputStream(decodedCredentials);
        } else {
            try {
                // Fallback to file-based credentials (for development only)
                serviceAccount = new ClassPathResource("serviceAccountKey.json").getInputStream();
            } catch (IOException e) {
                throw new RuntimeException("Firebase credentials not found. Please set FIREBASE_CREDENTIALS_BASE64 environment variable or provide serviceAccountKey.json", e);
            }
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .setDatabaseUrl(firebaseDatabaseUrl)
                .build();

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
        }
    }
} 