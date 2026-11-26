package com.ainexus.backend.service;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.secret-key}")
    private String secretKey;

    @Value("${supabase.storage.bucket}")
    private String bucket;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    @Value("${supabase.storage.payment-bucket:payment-proofs}")
    private String paymentBucket;

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
                    .header("Authorization", "Bearer " + serviceRoleKey)
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


    /**
     * Upload a payment proof to the separately configured private bucket.
     * Do not generate or expose a public URL for this object.
     */
    public String uploadPaymentProof(
            String filePath,
            byte[] fileBytes,
            String contentType
    ) {
        String encodedPath = UriUtils.encodePath(
                filePath,
                StandardCharsets.UTF_8
        );

        String uploadUrl = supabaseUrl
                + "/storage/v1/object/"
                + paymentBucket
                + "/"
                + encodedPath;

        restClient.post()
                .uri(uploadUrl)
                .header("apikey", secretKey)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("x-upsert", "true")
                .contentType(MediaType.parseMediaType(contentType))
                .body(fileBytes)
                .retrieve()
                .toBodilessEntity();

        return filePath;
    }


    /** Creates a short-lived signed URL for an object in the private payment bucket. */
    public String createPaymentProofSignedUrl(String filePath, int expiresInSeconds) {
        String encodedPath = UriUtils.encodePath(filePath, StandardCharsets.UTF_8);
        String signUrl = supabaseUrl + "/storage/v1/object/sign/" + paymentBucket + "/" + encodedPath;
        Map<?, ?> response = restClient.post()
                .uri(signUrl)
                .header("apikey", secretKey)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("expiresIn", expiresInSeconds))
                .retrieve()
                .body(Map.class);

        Object signedUrlValue = response == null ? null : response.get("signedURL");
        if (!(signedUrlValue instanceof String signedUrl) || signedUrl.isBlank()) {
            throw new RuntimeException("Supabase did not return a signed URL");
        }
        if (signedUrl.startsWith("https://") || signedUrl.startsWith("http://")) return signedUrl;
        if (signedUrl.startsWith("/")) return supabaseUrl + "/storage/v1" + signedUrl;
        return supabaseUrl + "/storage/v1/" + signedUrl;
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


    /** Deletes one object from the private payment-proofs bucket. */
    public void deletePaymentProof(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return;
        }

        String encodedPath = UriUtils.encodePath(
                filePath,
                StandardCharsets.UTF_8
        );

        String deleteUrl = supabaseUrl
                + "/storage/v1/object/"
                + paymentBucket
                + "/"
                + encodedPath;

        restClient.delete()
                .uri(deleteUrl)
                .header("apikey", secretKey)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .retrieve()
                .toBodilessEntity();
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
