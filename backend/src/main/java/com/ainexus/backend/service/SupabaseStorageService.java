package com.ainexus.backend.service;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;
import org.springframework.web.util.UriUtils;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.http.MediaType;

@Service
@RequiredArgsConstructor
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.secret-key}")
    private String secretKey;

    @Value("${supabase.storage.bucket}")
    private String bucket;

    private final RestClient restClient = RestClient.create();


    public String uploadImage(String filePath, byte[] fileBytes, String contentType) {

        String encodedPath = UriUtils.encodePath(
                filePath,
                StandardCharsets.UTF_8
        );

        String uploadUrl = supabaseUrl
                + "/storage/v1/object/"
                + bucket
                + "/"
                + encodedPath;

        try {
            System.out.println("Supabase Upload URL: " + uploadUrl);

            restClient.post()
                    .uri(uploadUrl)
                    .header("apikey", secretKey)
                    .header("Authorization", "Bearer " + secretKey)
                    .header("x-upsert", "true")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(fileBytes)
                    .retrieve()
                    .toBodilessEntity();

            System.out.println("Image uploaded successfully: " + filePath);

            return filePath;

        } catch (RestClientResponseException e) {

            System.err.println("========== SUPABASE UPLOAD ERROR ==========");
            System.err.println("Status: " + e.getStatusCode());
            System.err.println("Response: " + e.getResponseBodyAsString());
            System.err.println("===========================================");

            throw e;

        } catch (Exception e) {

            System.err.println("========== UPLOAD ERROR ==========");
            e.printStackTrace();
            System.err.println("==================================");

            throw new RuntimeException("Supabase image upload failed", e);
        }
    }

    public String getPublicUrl(String filePath) {
        String encodedPath = UriUtils.encodePath(
                filePath,
                StandardCharsets.UTF_8
        );

        return supabaseUrl
                + "/storage/v1/object/public/"
                + bucket
                + "/"
                + encodedPath;
    }

    public void deleteImage(String filePath) {
        String encodedPath = UriUtils.encodePath(
                filePath,
                StandardCharsets.UTF_8
        );

        String deleteUrl = supabaseUrl
                + "/storage/v1/object/"
                + bucket
                + "/"
                + encodedPath;

        restClient.delete()
                .uri(deleteUrl)
                .header("apikey", secretKey)
                .retrieve()
                .toBodilessEntity();
    }
}
