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

    // TEMPORARY ENVIRONMENT VARIABLE CHECK
    @PostConstruct
    public void checkMailConfig() {
        System.out.println("MAIL_FROM: " + fromEmail);

        System.out.println("MAIL_USERNAME present: " +
                (System.getenv("MAIL_USERNAME") != null));

        System.out.println("MAIL_PASSWORD present: " +
                (System.getenv("MAIL_PASSWORD") != null));
    }

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
                        "Regards,\n" +
                        "AI Nexus Club"
        );

        mailSender.send(message);
    }


    public void sendPasswordChangedNotification(String recipientEmail) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(recipientEmail);

        message.setSubject("AI Nexus Portal - Password Changed Successfully");

        message.setText(
                "Hello,\n\n" +
                        "Your AI Nexus Portal account password was successfully changed.\n\n" +
                        "If you made this change, no further action is required.\n\n" +
                        "If you did not change your password, your account may be at risk. " +
                        "Please contact the AI Nexus Club support team immediately.\n\n" +
                        "For your security, we recommend reviewing your account activity.\n\n" +
                        "Regards,\n" +
                        "AI Nexus Club"
        );

        mailSender.send(message);
    }


    public void sendContactMessage(
            String name,
            String senderEmail,
            String userMessage
    ) {
        SimpleMailMessage message = new SimpleMailMessage();

        // Always send from your verified Brevo sender.
        message.setFrom(fromEmail);

        // AI Nexus receives the contact form submission.
        message.setTo("ainexusclub@acropolis.in");

        // Allow the team to reply directly to the sender.
        message.setReplyTo(senderEmail);

        message.setSubject("AI Nexus Portal - New Contact Form Submission");

        message.setText(
                "A new message has been submitted through the AI Nexus website.\n\n" +

                        "Name: " + name + "\n" +
                        "Email: " + senderEmail + "\n\n" +

                        "Message:\n" +
                        userMessage + "\n\n" +

                        "--------------------------------\n" +
                        "AI Nexus Portal\n" +
                        "Acropolis Institute of Technology and Research"
        );

        mailSender.send(message);
    }


}
