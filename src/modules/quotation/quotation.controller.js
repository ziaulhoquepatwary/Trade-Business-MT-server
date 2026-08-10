import nodemailer from "nodemailer";
import catchAsync from "../../utils/catchAsync.js";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "mzh.mmrahman@gmail.com",
        pass: "llac ubms yymp nuzt",
    },
});

export const sendQuotationEmail = catchAsync(async (req, res) => {
    const { services, name, email, phone, company, description, budget, driveLink } = req.body;

    if (!name?.trim() || !email?.trim() || !description?.trim() || !services || services.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Please fill in all required fields and select at least one service.",
        });
    }

    const formattedServices = Array.isArray(services) ? services.join(", ") : services;

    const mailOptions = {
        from: `"${name}" <mzh.mmrahman@gmail.com>`,
        replyTo: email,
        to: "mzh.mmrahman@gmail.com",
        subject: `💼 NEW QUOTATION REQUEST from ${company ? company : name} (${budget || 'N/A'})`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
          .card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #3D52A0 0%, #1e293b 100%); color: #ffffff; padding: 32px 25px; text-align: center; }
          .header h2 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
          .header p { margin: 6px 0 0 0; color: #EDE8F5; font-size: 14px; opacity: 0.9; }
          .body { padding: 30px; color: #334155; }
          
          /* Table Styles */
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .info-table td { padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .label { font-weight: 600; color: #64748b; width: 32%; }
          .value { font-weight: 600; color: #0f172a; }
          
          /* Service Badges */
          .service-badge { display: inline-block; background: #EDE8F5; color: #3D52A0; font-weight: 700; padding: 4px 10px; border-radius: 6px; font-size: 12px; margin: 2px; border: 1px solid #7091E6; }
          
          /* Budget & Drive Box */
          .highlight-box { background: #f8fafc; border-left: 4px solid #3D52A0; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px; }
          .budget-badge { background: #10b981; color: #ffffff; font-weight: 700; padding: 4px 10px; border-radius: 20px; font-size: 13px; }
          
          /* Project Details */
          .description-box { background-color: #fafafa; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; }
          .box-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .box-content { margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-line; }
          
          .link-btn { display: inline-block; background: #3D52A0; color: #ffffff !important; font-weight: 600; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; margin-top: 6px; }
          
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2>New Quotation Proposal Request</h2>
            <p>A client has requested a custom price quote for their project</p>
          </div>
          
          <div class="body">
            <table class="info-table">
              <tr>
                <td class="label">Client Name:</td>
                <td class="value">${name}</td>
              </tr>
              <tr>
                <td class="label">Client Email:</td>
                <td class="value">
                  <a href="mailto:${email}" style="color: #3D52A0; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td class="label">Phone / WhatsApp:</td>
                <td class="value">${phone || "Not Provided"}</td>
              </tr>
              <tr>
                <td class="label">Company Name:</td>
                <td class="value">${company || "N/A"}</td>
              </tr>
              <tr>
                <td class="label">Selected Services:</td>
                <td class="value">
                  ${Array.isArray(services)
                ? services.map(s => `<span class="service-badge">${s}</span>`).join(" ")
                : `<span class="service-badge">${services}</span>`}
                </td>
              </tr>
            </table>

            <div class="highlight-box">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; color: #475569;">Estimated Budget Range:</span>
                <span class="budget-badge">${budget || "Flexible / Not Specified"}</span>
              </div>
              
              ${driveLink ? `
                <div style="margin-top: 12px; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
                  <span style="font-size: 13px; color: #64748b; font-weight: 600;">Attachments / Requirements Link:</span><br/>
                  <a href="${driveLink.startsWith('http') ? driveLink : 'https://' + driveLink}" target="_blank" class="link-btn">
                    📁 View Reference Files
                  </a>
                </div>
              ` : ''}
            </div>

            <div class="description-box">
              <div class="box-title">Project Requirements & Overview</div>
              <p class="box-content">${description}</p>
            </div>
          </div>

          <div class="footer">
            Sent automatically from your <strong>IT Solutions & Software Quotation Portal</strong>.
          </div>
        </div>
      </body>
      </html>
    `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
        success: true,
        message: "Quotation request submitted successfully!",
    });
});