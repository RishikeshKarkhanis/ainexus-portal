
package com.ainexus.backend.service;

import com.ainexus.backend.entity.*;
import com.ainexus.backend.repository.*;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import lombok.RequiredArgsConstructor;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.text.Normalizer;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HallTicketService {

    private final TicketRepository ticketRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;

    private static final Color NAVY = new Color(20, 35, 65);
    private static final Color BLUE = new Color(48, 95, 180);
    private static final Color LIGHT = new Color(240, 244, 250);
    private static final Color GREY = new Color(100, 110, 125);

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy");

    // ==========================================
    // 1. GENERATE HALL TICKET
    // ==========================================

    public byte[] generateHallTicket(String qrToken) throws IOException {

        // Fetch ticket.
        Ticket ticket = ticketRepository.findByQrToken(qrToken)
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid ticket token"));

        // Fetch team member.
        TeamMember teamMember = teamMemberRepository
                .findById(ticket.getTeamMemberId())
                .orElseThrow(() ->
                        new IllegalStateException("Team member not found"));

        // Fetch participant.
        User user = userRepository.findById(teamMember.getUserId())
                .orElseThrow(() ->
                        new IllegalStateException("Participant not found"));

        // Fetch team.
        Team team = teamRepository.findById(teamMember.getTeamId())
                .orElseThrow(() ->
                        new IllegalStateException("Team not found"));

        // Fetch registration.
        Registration registration = registrationRepository
                .findByTeamId(team.getTeamId())
                .orElseThrow(() ->
                        new IllegalStateException("Registration not found"));

        // Fetch event.
        Event event = eventRepository.findById(registration.getEventId())
                .orElseThrow(() ->
                        new IllegalStateException("Event not found"));

        // Generate QR image.
        byte[] qrImage = generateQrCode(qrToken);

        // Generate PDF.
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDType1Font regular = new PDType1Font(
                    Standard14Fonts.FontName.HELVETICA
            );

            PDType1Font bold = new PDType1Font(
                    Standard14Fonts.FontName.HELVETICA_BOLD
            );

            try (PDPageContentStream content =
                         new PDPageContentStream(document, page)) {

                // Header.
                content.setNonStrokingColor(NAVY);
                content.addRect(0, 700, 595, 142);
                content.fill();

                addText(content, bold, 23, Color.WHITE,
                        45, 790, "AI NEXUS");

                addText(content, regular, 11, Color.WHITE,
                        45, 768, "ACROPOLIS INSTITUTE OF TECHNOLOGY AND RESEARCH");

                addText(content, bold, 19, Color.WHITE,
                        45, 728, "EVENT HALL TICKET");

                // Status badge.
                content.setNonStrokingColor(new Color(220, 245, 230));
                content.addRect(45, 660, 110, 25);
                content.fill();

                addText(content, bold, 10, new Color(30, 120, 70),
                        58, 668, "CONFIRMED");

                // Participant section.
                addText(content, bold, 15, NAVY,
                        45, 625, "PARTICIPANT DETAILS");

                addText(content, regular, 9, GREY,
                        45, 592, "PARTICIPANT NAME");

                addText(content, bold, 16, NAVY,
                        45, 570, user.getName());

                addText(content, regular, 10, GREY,
                        45, 548, user.getEmail());

                addText(content, regular, 9, GREY,
                        45, 515, "MEMBER ID");

                addText(content, regular, 10, Color.BLACK,
                        45, 497, teamMember.getTeamMemberId().toString());

                addText(content, regular, 9, GREY,
                        45, 470, "USER ID");

                addText(content, regular, 10, Color.BLACK,
                        45, 452, user.getUserId().toString());

                // QR code.
                PDImageXObject qr = PDImageXObject.createFromByteArray(
                        document, qrImage, "ticket-qr"
                );

                content.drawImage(qr, 380, 450, 145, 145);

                addText(content, bold, 9, NAVY,
                        400, 432, "SCAN AT ENTRY");

                // Event section.
                content.setNonStrokingColor(LIGHT);
                content.addRect(35, 270, 525, 135);
                content.fill();

                addText(content, bold, 14, NAVY,
                        50, 380, "EVENT DETAILS");

                addText(content, regular, 9, GREY,
                        50, 350, "EVENT NAME");

                addText(content, bold, 14, NAVY,
                        50, 329, event.getEventName());

                addText(content, regular, 9, GREY,
                        50, 302, "EVENT DATE");

                addText(content, bold, 11, Color.BLACK,
                        50, 284, event.getEventDate().format(DATE_FORMAT));

                addText(content, regular, 9, GREY,
                        320, 302, "REGISTRATION ID");

                addText(content, regular, 8, Color.BLACK,
                        320, 284, registration.getRegistrationId().toString());

                // Team section.
                addText(content, bold, 13, NAVY,
                        45, 235, "TEAM DETAILS");

                addText(content, regular, 9, GREY,
                        45, 208, "TEAM NAME");

                addText(content, bold, 12, Color.BLACK,
                        45, 190, team.getTeamName());

                addText(content, regular, 9, GREY,
                        45, 165, "TEAM ID");

                addText(content, regular, 9, Color.BLACK,
                        45, 147, team.getTeamId().toString());

                // Ticket details.
                addText(content, regular, 9, GREY,
                        45, 115, "TICKET ID");

                addText(content, regular, 9, Color.BLACK,
                        45, 98, ticket.getTicketId().toString());

                addText(content, regular, 9, GREY,
                        320, 115, "ISSUED ON");

                addText(content, regular, 9, Color.BLACK,
                        320, 98, ticket.getIssuedAt().format(
                                DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")
                        ));

                // Footer.
                content.setStrokingColor(BLUE);
                content.moveTo(35, 75);
                content.lineTo(560, 75);
                content.stroke();

                addText(content, regular, 9, GREY,
                        45, 55, "Please carry this ticket for event entry.");

                addText(content, bold, 9, NAVY,
                        45, 38, "AI NEXUS CLUB | ACROPOLIS");

            }

            document.save(output);
            return output.toByteArray();
        }
    }

    // ==========================================
    // 2. GENERATE QR CODE
    // ==========================================

    private byte[] generateQrCode(String token) throws IOException {

        try {
            QRCodeWriter writer = new QRCodeWriter();

            BitMatrix matrix = writer.encode(
                    token,
                    BarcodeFormat.QR_CODE,
                    350,
                    350
            );

            ByteArrayOutputStream output = new ByteArrayOutputStream();

            MatrixToImageWriter.writeToStream(
                    matrix,
                    "PNG",
                    output
            );

            return output.toByteArray();

        } catch (Exception exception) {
            throw new IOException("QR generation failed", exception);
        }
    }

    // ==========================================
    // 3. PDF TEXT HELPER
    // ==========================================

    private void addText(
            PDPageContentStream content,
            PDType1Font font,
            float fontSize,
            Color color,
            float x,
            float y,
            String value
    ) throws IOException {

        content.beginText();
        content.setFont(font, fontSize);
        content.setNonStrokingColor(color);
        content.newLineAtOffset(x, y);
        content.showText(safeText(value));
        content.endText();
    }

    // Standard PDF fonts have limited character support.
    private String safeText(String value) {

        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(
                value,
                Normalizer.Form.NFKD
        );

        StringBuilder result = new StringBuilder();

        normalized.codePoints().forEach(codePoint -> {
            if (codePoint >= 32 && codePoint <= 255) {
                result.appendCodePoint(codePoint);
            } else {
                result.append('?');
            }
        });

        return result.toString();
    }
}
