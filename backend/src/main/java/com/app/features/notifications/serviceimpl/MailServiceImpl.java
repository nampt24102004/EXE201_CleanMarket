package com.app.features.notifications.serviceimpl;

import com.app.features.notifications.dto.MailEventDto.OrderItemMail;
import com.app.features.notifications.dto.MailEventDto.OrderPlacedMailEvent;
import com.app.features.notifications.dto.MailEventDto.PaymentSucceededMailEvent;
import com.app.features.notifications.service.MailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class MailServiceImpl implements MailService {
    private final JavaMailSender sender;
    private final String username;
    private final String fromEmail;
    private final String fromName;
    private final String supportEmail;
    private final String logoUrl;
    private final String frontendUrl;
    private final boolean deliveryEnabled;

    public MailServiceImpl(JavaMailSender sender,
            @Value("${spring.mail.username:}") String username,
            @Value("${app.mail.from-email:}") String fromEmail,
            @Value("${app.mail.from-name:CleanMarket}") String fromName,
            @Value("${app.mail.support-email:}") String supportEmail,
            @Value("${app.mail.logo-url:}") String logoUrl,
            @Value("${app.frontend.base-url}") String frontendUrl,
            @Value("${app.mail.delivery-enabled:true}") boolean deliveryEnabled) {
        this.sender = sender;
        this.username = username;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.supportEmail = supportEmail;
        this.logoUrl = logoUrl;
        this.frontendUrl = frontendUrl;
        this.deliveryEnabled = deliveryEnabled;
    }

    @Override public void sendVerificationOtp(String email, String fullName, String otp, int ttlMinutes) {
        String content = "<p>Xin chào <strong>" + esc(fullName) + "</strong>,</p>"
            + "<p>Dùng mã OTP sau để xác thực tài khoản CleanMarket:</p>"
            + "<div style=\"font-size:32px;letter-spacing:8px;font-weight:800;color:#16803c;text-align:center;padding:18px;background:#effaf2;border-radius:12px\">" + esc(otp) + "</div>"
            + "<p>Mã có hiệu lực trong <strong>" + ttlMinutes + " phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>";
        send(email, "Mã xác thực tài khoản CleanMarket", layout("Xác thực email", content));
    }

    @Override public void sendPasswordResetLink(String email, String fullName, String resetUrl, int ttlMinutes) {
        String content = "<p>Xin chào <strong>" + esc(fullName) + "</strong>,</p>"
            + "<p>CleanMarket nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>"
            + button("Đặt lại mật khẩu", resetUrl)
            + "<p>Liên kết có hiệu lực trong <strong>" + ttlMinutes + " phút</strong> và chỉ dùng được một lần. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>";
        send(email, "Đặt lại mật khẩu CleanMarket", layout("Đặt lại mật khẩu", content));
    }

    @Override public void sendOrderConfirmation(OrderPlacedMailEvent event) {
        StringBuilder rows = new StringBuilder();
        for (OrderItemMail item : event.items()) {
            rows.append("<tr><td style=\"padding:10px;border-bottom:1px solid #e8ece9\">").append(esc(item.name())).append("</td><td style=\"padding:10px;border-bottom:1px solid #e8ece9\">")
                .append(item.quantity().stripTrailingZeros().toPlainString()).append(' ').append(esc(item.unit())).append("</td><td style=\"padding:10px;border-bottom:1px solid #e8ece9;text-align:right\">")
                .append(money(item.totalAmount())).append("</td></tr>");
        }
        String content = "<p>Xin chào <strong>" + esc(event.customerName()) + "</strong>,</p><p>Đơn hàng của bạn đã được ghi nhận thành công.</p>"
            + "<p><strong>Mã đơn:</strong> " + esc(event.orderCode()) + "<br><strong>Thanh toán:</strong> " + esc(event.paymentMethod()) + "<br><strong>Địa chỉ:</strong> " + esc(event.address()) + "</p>"
            + "<table style=\"width:100%;border-collapse:collapse\"><thead><tr style=\"background:#effaf2\"><th style=\"padding:10px;text-align:left\">Sản phẩm</th><th style=\"padding:10px;text-align:left\">Số lượng</th><th style=\"padding:10px;text-align:right\">Thành tiền</th></tr></thead><tbody>" + rows + "</tbody></table>"
            + "<p style=\"font-size:18px;text-align:right\"><strong>Tổng cộng: " + money(event.totalAmount()) + "</strong></p>"
            + button("Xem đơn hàng", frontendUrl + "/orders/" + event.orderCode());
        send(event.email(), "Xác nhận đơn hàng " + event.orderCode(), layout("Đặt hàng thành công", content));
    }

    @Override public void sendPaymentConfirmation(PaymentSucceededMailEvent event) {
        String paidAt = event.paidAt() == null ? "" : DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss").withZone(ZoneId.of("Asia/Ho_Chi_Minh")).format(event.paidAt());
        StringBuilder rows = new StringBuilder();
        if (event.items() != null) for (OrderItemMail item : event.items()) {
            rows.append("<tr><td style=\"padding:10px;border-bottom:1px solid #e8ece9\">").append(esc(item.name())).append("</td><td style=\"padding:10px;border-bottom:1px solid #e8ece9\">")
                .append(item.quantity().stripTrailingZeros().toPlainString()).append(' ').append(esc(item.unit())).append("</td><td style=\"padding:10px;border-bottom:1px solid #e8ece9;text-align:right\">")
                .append(money(item.totalAmount())).append("</td></tr>");
        }
        String itemTable = rows.isEmpty() ? "" : "<h3>Đơn của bạn gồm</h3><table style=\"width:100%;border-collapse:collapse\"><thead><tr style=\"background:#effaf2\"><th style=\"padding:10px;text-align:left\">Sản phẩm</th><th style=\"padding:10px;text-align:left\">Số lượng</th><th style=\"padding:10px;text-align:right\">Thành tiền</th></tr></thead><tbody>" + rows + "</tbody></table>";
        String content = "<p>Xin chào <strong>" + esc(event.customerName()) + "</strong>,</p><p>CleanMarket đã nhận được thanh toán cho đơn hàng của bạn.</p>"
            + "<div style=\"padding:16px;background:#effaf2;border-radius:12px\"><strong>Mã đơn:</strong> " + esc(event.orderCode()) + "<br><strong>Tổng tiền:</strong> " + money(event.amount()) + "<br><strong>Phương thức:</strong> " + esc(event.paymentMethod()) + "<br><strong>Trạng thái:</strong> Đã thanh toán<br><strong>Thời gian:</strong> " + esc(paidAt) + "</div>"
            + itemTable + "<p>Đơn hàng đang được chuẩn bị và sẽ được giao đến <strong>" + esc(event.address()) + "</strong> sớm nhất.</p><p>Cảm ơn bạn đã mua hàng tại CleanMarket.</p>"
            + button("Xem đơn hàng", frontendUrl + "/orders/" + event.orderCode());
        send(event.email(), "CleanMarket - Thanh toán đơn hàng thành công", layout("THANH TOÁN THÀNH CÔNG", content));
    }

    @Override public void sendNotice(com.app.features.notifications.dto.MailEventDto.NoticeMailEvent event) {
        String content = "<p>Xin chào <strong>" + esc(event.fullName()) + "</strong>,</p>"
            + "<p>" + esc(event.message()).replace("\n", "<br>") + "</p>"
            + (event.path() == null ? "" : button("Xem chi tiết", frontendUrl.replaceAll("/+$", "") + event.path()));
        send(event.email(), event.title() + " - CleanMarket", layout(event.title(), content));
    }

    private void send(String to, String subject, String html) {
        if (!deliveryEnabled) return;
        String senderAddress = fromEmail.isBlank() ? username : fromEmail;
        if (senderAddress.isBlank()) throw new IllegalStateException("SMTP_FROM_EMAIL hoặc SMTP_USERNAME chưa được cấu hình");
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(senderAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            sender.send(message);
        } catch (MessagingException | UnsupportedEncodingException ex) {
            throw new IllegalStateException("Không thể tạo email", ex);
        }
    }

    private String layout(String title, String content) {
        String logo = logoUrl.isBlank() ? "<div style=\"font-size:24px;font-weight:800;color:#16803c\">CleanMarket</div>" : "<img src=\"" + esc(logoUrl) + "\" alt=\"CleanMarket\" style=\"max-height:72px;max-width:220px;border-radius:10px\">";
        String support = supportEmail.isBlank() ? "" : "<p style=\"font-size:12px;color:#6b756f\">Hỗ trợ: " + esc(supportEmail) + "</p>";
        return "<!doctype html><html><body style=\"margin:0;background:#f4f7f5;font-family:Arial,sans-serif;color:#20352a\"><div style=\"max-width:640px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden\"><div style=\"padding:24px;background:#e9f8ed;text-align:center\">" + logo + "</div><div style=\"padding:28px\"><h1 style=\"font-size:24px;color:#126b33\">" + esc(title) + "</h1>" + content + support + "</div></div></body></html>";
    }
    private String button(String label, String url) { return "<p style=\"text-align:center;margin:28px 0\"><a href=\"" + esc(url) + "\" style=\"display:inline-block;background:#16803c;color:#fff;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:700\">" + esc(label) + "</a></p>"; }
    private String money(BigDecimal value) { return NumberFormat.getCurrencyInstance(new Locale("vi", "VN")).format(value); }
    private String esc(String value) { return HtmlUtils.htmlEscape(value == null ? "" : value); }
}
