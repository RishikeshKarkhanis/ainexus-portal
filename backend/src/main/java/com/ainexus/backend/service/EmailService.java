
package com.ainexus.backend.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${MAIL_FROM}")
    private String fromEmail;

    @PostConstruct
    public void checkMailConfig() {
        System.out.println("MAIL_FROM configured: " + (fromEmail != null));
        System.out.println("MAIL_USERNAME present: " +
                (System.getenv("MAIL_USERNAME") != null));
        System.out.println("MAIL_PASSWORD present: " +
                (System.getenv("MAIL_PASSWORD") != null));
    }

    // Password reset OTP
    public void sendPasswordResetOtp(String recipientEmail, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(recipientEmail);
        message.setSubject("AI Nexus Portal - Password Reset OTP");

        message.setText(
                "Hello,\n\n" +
                        "We received a request to reset your AI Nexus Portal password.\n\n" +
                        "Your OTP is: " + otp + "\n\n" +
                        "This OTP is valid for 5 minutes.\n\n" +
                        "If you did not request this password reset, please ignore this email.\n\n" +
                        "Regards,\nAI Nexus Club"
        );

        mailSender.send(message);
    }

    // Password changed notification
    public void sendPasswordChangedNotification(String recipientEmail) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(recipientEmail);
        message.setSubject("AI Nexus Portal - Password Changed Successfully");

        message.setText(
                "Hello,\n\n" +
                        "Your AI Nexus Portal account password was successfully changed.\n\n" +
                        "If you made this change, no further action is required.\n\n" +
                        "If you did not change your password, please contact AI Nexus Club support.\n\n" +
                        "Regards,\nAI Nexus Club"
        );

        mailSender.send(message);
    }

    // Contact form message
    public void sendContactMessage(
            String name,
            String senderEmail,
            String userMessage
    ) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo("ainexusclub@acropolis.in");
        message.setReplyTo(senderEmail);
        message.setSubject("AI Nexus Portal - New Contact Form Submission");

        message.setText(
                "A new message has been submitted through the AI Nexus website.\n\n" +
                        "Name: " + name + "\n" +
                        "Email: " + senderEmail + "\n\n" +
                        "Message:\n" + userMessage + "\n\n" +
                        "AI Nexus Portal\n" +
                        "Acropolis Institute of Technology and Research"
        );

        mailSender.send(message);
    }

    // Successful event registration confirmation
    public void sendRegistrationConfirmation(
            String recipientName,
            String recipientEmail,
            String eventName,
            String eventDate,
            String teamName,
            String ticketCode
    ) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(recipientEmail);

        message.setSubject(
                "Registration Confirmed - " + eventName + " | AI Nexus"
        );

        message.setText(
                "Hello " + recipientName + ",\n\n" +

                        "Congratulations! Your registration has been successfully confirmed.\n\n" +

                        "Here are your registration details:\n\n" +

                        "Event: " + eventName + "\n" +
                        "Event Date: " + eventDate + "\n" +
                        "Team Name: " + teamName + "\n" +
                        "Your Ticket Code: " + ticketCode + "\n\n" +

                        "Please keep this email safe and retain your ticket code " +
                        "for event check-in.\n\n" +

                        "We look forward to seeing you at the event!\n\n" +

                        "Regards,\n" +
                        "AI Nexus Club\n" +
                        "Acropolis Institute of Technology and Research"
        );

        mailSender.send(message);
    }

    public void sendAdminOtp(String recipientEmail, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(recipientEmail);

        message.setSubject("AI Nexus Portal - Admin Login OTP");

        message.setText(
                "Hello Admin,\n\n" +
                        "Your OTP for AI Nexus Portal administrator login is:\n\n" +
                        otp + "\n\n" +
                        "This OTP is valid for 5 minutes.\n\n" +
                        "If you did not initiate this login, please ignore this email.\n\n" +
                        "Regards,\n" +
                        "AI Nexus Club"
        );

        mailSender.send(message);
    }
}
