package lk.fat2fit.Fat2Fit.Service;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MembershipExpiryEmailService {

    private final JavaMailSender mailSender;

    @Value("${membership.expiry.notification.from:${spring.mail.username:no-reply@fat2fit.lk}}")
    private String fromAddress;

    public void sendExpiryReminder(String recipientEmail, String memberName, LocalDate expiryDate, int daysBeforeExpiry) {
        String subject = "Membership Expiry Reminder - " + daysBeforeExpiry + " day(s) remaining";
        String body = "Dear Team,\n\n"
                + "This is an automated reminder that the following membership is nearing expiry.\n\n"
                + "Member Name: " + memberName + "\n"
                + "Expiry Date: " + expiryDate + "\n"
                + "Days Remaining: " + daysBeforeExpiry + "\n\n"
                + "Please contact the member for renewal.\n\n"
                + "Regards,\n"
                + "Fat2Fit System";

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(recipientEmail);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
}
