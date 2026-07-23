package com.starto.service;

import com.starto.model.User;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

import org.springframework.scheduling.annotation.Async;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    private static final String FROM_EMAIL = "startoindiaofficial@gmail.com";

    public void sendEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setFrom("Starto Ecosystem <startoindiaofficial@gmail.com>");
            helper.setReplyTo("startoindiaofficial@gmail.com");
            helper.setSubject(subject);

            // Wrap in proper HTML structure
            String fullHtml = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body>" + htmlBody + "</body></html>";
            
            // Create a plain text fallback to bypass spam filters
            String plainText = htmlBody.replaceAll("<br\\s*/?>", "\n").replaceAll("<[^>]*>", "").replaceAll("&nbsp;", " ").trim();
            
            // Set multipart content (true = HTML, false = plain text fallback)
            helper.setText(plainText, fullHtml);

            mailSender.send(message);
            log.info("🚀 SUCCESS: Email sent to: [{}]", to);
            System.out.println("🚀 SUCCESS: Email sent to: [" + to + "]");

        } catch (Exception e) {
            log.error(" EMAIL FAILED to {} | ERROR: {}", to, e.getMessage(), e);
        }
    }

    //  EXPIRY REMINDER 
    @Async("aiExecutor")
    public void sendExpiryReminder(User user, int daysLeft) {
        String subject = "Your Starto plan expires in " + daysLeft + " day(s)";
        sendEmail(user.getEmail(), subject, buildExpiryBody(user, daysLeft));
    }

    private String buildExpiryBody(User user, int daysLeft) {
        return """
            <div style="font-family: Arial; max-width:600px; margin:auto;">
                <h2 style="color:#f97316;">⚠️ Plan Expiring Soon</h2>
                <p>Hi <b>%s</b>,</p>
                <p>Your <b>%s</b> plan expires in <b>%d day(s)</b>.</p>
                <ul>
                    <li>Signals</li>
                    <li>WhatsApp Unlock</li>
                    <li>AI Features</li>
                </ul>
                <a href="https://starto.in/subscription"
                   style="background:#f97316;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
                   Upgrade Now
                </a>
            </div>
            """.formatted(user.getName(), user.getPlan().name(), daysLeft);
    }

    // VERIFICATION
    @Async("aiExecutor")
    public void sendCustomVerificationEmail(String email, String verificationLink) {
        String subject = "Verify your email for Starto";
        sendEmail(email, subject, buildVerificationBody(verificationLink));
    }

    private String buildVerificationBody(String verificationLink) {
        return """
            <div style="font-family: Arial; max-width:600px; margin:auto;">
                <h2 style="color:#f97316;">Verify Your Account</h2>
                <p>Welcome to Starto!</p>
                <p>Please click the button below to verify your email address and activate your account.</p>
                <br/>
                <a href="%s"
                   style="background:#f97316;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                   Verify Email
                </a>
                <br/><br/>
                <p style="color:#666;font-size:12px;">If you didn't create this account, you can safely ignore this email.</p>
            </div>
            """.formatted(verificationLink);
    }

    // WELCOME 
    @Async("aiExecutor")
    public void sendWelcomePlanEmail(User user) {
        String subject = "Welcome to Starto " + user.getPlan().name();
        sendEmail(user.getEmail(), subject, buildWelcomeBody(user));
    }

    private String buildWelcomeBody(User user) {
        return """
            <div style="font-family: Arial; max-width:600px; margin:auto;">
                <h2 style="color:#f97316;">Welcome %s 🚀</h2>
                <p>Hi <b>%s</b>,</p>
                <p>You activated <b>%s</b> plan.</p>
                %s
                <a href="https://starto.in/dashboard"
                   style="background:#f97316;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
                   Dashboard
                </a>
            </div>
            """.formatted(
                user.getPlan().name(),
                user.getName(),
                user.getPlan().name(),
                getPlanFeatures(user.getPlan().name())
        );
    }

    //  PAYMENT
    @Async("aiExecutor")
    public void sendPaymentSuccessEmail(User user, String plan, int amountPaise, String orderId) {

        double amount = amountPaise / 100.0;

        String subject = "Payment Successful — " + plan + " Activated";

        String body = """
            <div style="font-family: Arial; max-width:600px; margin:auto;">
                <h2 style="color:#22c55e;">Payment Successful ✅</h2>
                <p>Hi <b>%s</b>,</p>

                <table style="width:100%%;">
                    <tr><td>Plan</td><td><b>%s</b></td></tr>
                    <tr><td>Amount</td><td><b>₹%.2f</b></td></tr>
                    <tr><td>Order ID</td><td>%s</td></tr>
                    <tr><td>Date</td><td>%s</td></tr>
                </table>

                <a href="https://starto.in/dashboard"
                   style="background:#f97316;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
                   Dashboard
                </a>
            </div>
            """.formatted(user.getName(), plan, amount, orderId, LocalDate.now());

        sendEmail(user.getEmail(), subject, body);
    }

    //  UPGRADE 
    @Async("aiExecutor")
    public void sendPlanUpgradeEmail(User user, String oldPlan, String newPlan) {

        String subject = "Upgraded to " + newPlan + " 🚀";

        String body = """
            <div style="font-family: Arial; max-width:600px; margin:auto;">
                <h2 style="color:#f97316;">Upgrade Successful 🚀</h2>
                <p>Hi <b>%s</b>,</p>
                <p>%s → <b>%s</b></p>
                %s
            </div>
            """.formatted(
                user.getName(),
                oldPlan,
                newPlan,
                getPlanFeatures(newPlan)
        );

        sendEmail(user.getEmail(), subject, body);
    }

    //  EXPIRED 
    @Async("aiExecutor")
    public void sendPlanExpiredEmail(User user) {

        String subject = "Your Plan Expired ❌";

        String body = """
            <div style="font-family: Arial; max-width:600px; margin:auto;">
                <h2 style="color:#ef4444;">Plan Expired ❌</h2>
                <p>Hi <b>%s</b>,</p>
                <p>Your <b>%s</b> plan expired.</p>
                <p>Now on <b>EXPLORER</b> plan.</p>
                <a href="https://starto.in/subscription"
                   style="background:#ef4444;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
                   Upgrade
                </a>
            </div>
            """.formatted(user.getName(), user.getPlan().name());

        sendEmail(user.getEmail(), subject, body);
    }

    //  FEATURES 
    private String getPlanFeatures(String plan) {
        return switch (plan) {
            case "TRIAL" -> "<ul><li>5 Active Signals</li><li>10 Connection Offers</li><li>5 AI Analysis calls</li></ul>";
            case "SPRINT" -> "<ul><li>5 Active Signals</li><li>20 Connection Offers</li><li>10 AI Analysis calls</li></ul>";
            case "BOOST" -> "<ul><li>8 Active Signals</li><li>Unlimited Offers</li><li>15 AI Analysis calls</li></ul>";
            case "PRO" -> "<ul><li>10 Active Signals</li><li>Unlimited Offers</li><li>20 AI Analysis calls</li></ul>";
            case "PRO_PLUS" -> "<ul><li>Unlimited Signals</li><li>Unlimited Offers</li><li>30 AI Analysis calls</li></ul>";
            case "GROWTH" -> "<ul><li>Unlimited Signals</li><li>Unlimited Offers</li><li>Unlimited AI Analysis</li></ul>";
            case "ANNUAL" -> "<ul><li>Unlimited Everything</li><li>Legacy Profile Badge</li><li>Priority Support</li></ul>";
            case "CAPTAIN" -> "<ul><li>10 Active Signals</li><li>Unlimited Offers</li><li>20 AI Analysis calls</li></ul>";
            case "CAPTAIN_PRO" -> "<ul><li>Unlimited Signals</li><li>Unlimited Offers</li><li>Unlimited AI Analysis</li></ul>";
            default -> "<ul><li>Basic Ecosystem Access</li><li>Networking Tools</li></ul>";
        };
    }

    @Async("aiExecutor")
    public void sendWelcomeEmail(User user) {

    String subject = "Welcome to Starto 🚀";

    String body = """
        <div style="font-family: Arial; max-width:600px; margin:auto;">
            <h2 style="color:#f97316;">Welcome to Starto 🚀</h2>

            <p>Hi <b>%s</b>,</p>

            <p>We’re excited to have you onboard 🎉</p>

            <p>
                Starto helps you connect, explore signals, unlock offers,
                and grow faster.
            </p>

            <ul>
                <li>Explore signals</li>
                <li>Unlock WhatsApp contacts</li>
                <li>Use AI-powered features</li>
            </ul>

            <p>
                You are currently on <b>EXPLORER</b> plan.
                Upgrade anytime to unlock more features.
            </p>

            <a href="https://starto.in/dashboard"
               style="background:#f97316;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
               Go to Dashboard
            </a>

            <p style="margin-top:20px;">— Team Starto ❤️</p>
        </div>
    """.formatted(user.getName());

    sendEmail(user.getEmail(), subject, body);
    }

    @Async("aiExecutor")
    public void sendContactEmail(String name, String fromEmail, String message) {
        String subject = "New Contact Form Submission from " + name;
        String body = """
            <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #eee; padding:20px; border-radius:10px;">
                <h2 style="color:#0A0A0A; border-bottom:1px solid #eee; padding-bottom:10px;">New Contact Inquiry</h2>
                <p><b>Name:</b> %s</p>
                <p><b>Email:</b> %s</p>
                <p><b>Message:</b></p>
                <div style="background:#f9f9f9; padding:15px; border-radius:8px; border-left:4px solid #0A0A0A;">
                    %s
                </div>
                <p style="margin-top:20px; font-size:12px; color:#666;">
                    This message was sent from the Starto Contact Form.
                </p>
            </div>
        """.formatted(name, fromEmail, message);

        sendEmail("startoindiaofficial@gmail.com", subject, body);
    }
}
