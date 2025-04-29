package com.teamhyungie.WildWatch.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.UUID;

@Service
public class SupabaseStorageService {
    private final Logger logger = LoggerFactory.getLogger(SupabaseStorageService.class);
    private final RestTemplate restTemplate;
    private final String supabaseUrl;
    private final String supabaseKey;
    private static final String BUCKET_NAME = "wildwatch-uploads";

    public SupabaseStorageService(
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.key}") String supabaseKey) {
        this.restTemplate = new RestTemplate();
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        logger.info("Initializing Supabase Storage Service with URL: {}", supabaseUrl);
    }

    public String storeFile(MultipartFile file) {
        try {
            // Generate a unique filename
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            logger.info("Storing file: {} with generated name: {}", file.getOriginalFilename(), fileName);

            // Create headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("x-client-info", "wildwatch-backend");

            // Create the request body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            });

            // Create the request entity
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // Upload the file
            String uploadUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, BUCKET_NAME, fileName);
            logger.info("Uploading file to: {}", uploadUrl);
            
            ResponseEntity<String> response = restTemplate.exchange(
                    uploadUrl,
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );

            if (response.getStatusCode() != HttpStatus.OK) {
                logger.error("Failed to upload file. Status: {}, Response: {}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("Failed to upload file: " + response.getBody());
            }

            // Get the public URL
            String publicUrl = String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, BUCKET_NAME, fileName);
            logger.info("File uploaded successfully. Public URL: {}", publicUrl);
            return publicUrl;

        } catch (IOException ex) {
            logger.error("Failed to store file: {}", file.getOriginalFilename(), ex);
            throw new RuntimeException("Could not store file " + file.getOriginalFilename() + ". Please try again!", ex);
        }
    }

    public void deleteFile(String fileName) {
        try {
            logger.info("Deleting file: {}", fileName);

            // Create headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("x-client-info", "wildwatch-backend");

            // Create the request entity
            HttpEntity<?> requestEntity = new HttpEntity<>(headers);

            // Delete the file
            String deleteUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, BUCKET_NAME, fileName);
            logger.info("Deleting file from: {}", deleteUrl);
            
            ResponseEntity<String> response = restTemplate.exchange(
                    deleteUrl,
                    HttpMethod.DELETE,
                    requestEntity,
                    String.class
            );

            if (response.getStatusCode() != HttpStatus.OK) {
                logger.error("Failed to delete file. Status: {}, Response: {}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("Failed to delete file: " + response.getBody());
            }

            logger.info("File deleted successfully: {}", fileName);
        } catch (Exception ex) {
            logger.error("Failed to delete file: {}", fileName, ex);
            throw new RuntimeException("Could not delete file " + fileName + ". Please try again!", ex);
        }
    }
}