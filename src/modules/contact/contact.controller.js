import nodemailer from "nodemailer";
import catchAsync from "../../utils/catchAsync";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const contactEmail = catchAsync(async (req, res) => {
    const { name, email, service, message } = req.body;

    if (!name?.trim() || !email?.trim() || !service?.trim() || !message?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Please fill in all required fields.",
        });
    }

    const mailOptions = {
        from: `"${name}" <${process.env.SMTP_USER}>`,
        replyTo: email,
        to: process.env.SMTP_USER,
        subject: `🚀 New Service Inquiry: ${service} - ${name}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 30px; text-align: center; }
          .header h2 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px; }
          .header p { margin: 5px 0 0 0; color: #94a3b8; font-size: 14px; }
          .body { padding: 30px; color: #334155; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .info-table td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
          .label { font-weight: 600; color: #64748b; width: 35%; font-size: 14px; }
          .value { font-weight: 500; color: #0f172a; font-size: 15px; }
          .badge { display: inline-block; background: #eff6ff; color: #2563eb; font-weight: 600; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #bfdbfe; }
          .message-box { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; border-radius: 0 8px 8px 0; margin-top: 10px; }
          .message-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
          .message-content { margin: 0; font-size: 15px; line-height: 1.6; color: #1e293b; white-space: pre-line; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2>IT Solution & Software Inquiry</h2>
            <p>New message received via contact form</p>
          </div>
          
          <div class="body">
            <table class="info-table">
              <tr>
                <td class="label">Client Name</td>
                <td class="value">${name}</td>
              </tr>
              <tr>
                <td class="label">Client Email</td>
                <td class="value">
                  <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td class="label">Requested Service</td>
                <td class="value">
                  <span class="badge">${service}</span>
                </td>
              </tr>
            </table>

            <div class="message-box">
              <div class="message-title">Project Details / Message</div>
              <p class="message-content">${message}</p>
            </div>
          </div>

          <div class="footer">
            Sent automatically from your <strong>Software & IT Solution Website</strong>.
          </div>
        </div>
      </body>
      </html>
    `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
        success: true,
        message: "Your message has been sent successfully!",
    });
});