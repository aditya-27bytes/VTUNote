import nodemailer from "nodemailer";

// Email transporter configuration
// Lazy transporter initialization (to ensure env vars are loaded)
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // TLS
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD // Use App Password for Gmail
      }
    });
    
    // Log transporter configuration for debugging
    console.log('📧 Email Service Initialized:');
    console.log(`   Host: ${transporter.options.host}`);
    console.log(`   Port: ${transporter.options.port}`);
    console.log(`   Secure: ${transporter.options.secure}`);
    console.log(`   Auth User: ${transporter.options.auth.user}`);
    console.log(`   Auth Pass: ${transporter.options.auth.pass ? '✅ SET' : '❌ NOT SET'}`);
  }
  return transporter;
};
// Generate random 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to email
export const sendOTPEmail = async (email, otp, userType) => {
  try {
    const subject = `VTU NOTE Student Study Assistant - ${userType.charAt(0).toUpperCase() + userType.slice(1)} Verification OTP`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">VTU NOTE Student Study Assistant</h2>
          <p style="color: #666; text-align: center; font-size: 14px; margin-bottom: 20px;">
            ${userType.charAt(0).toUpperCase() + userType.slice(1)} Registration Verification
          </p>
          
          <div style="text-align: center; padding: 20px 0;">
            <p style="color: #333; font-size: 16px; margin-bottom: 10px;">
              Your One-Time Password (OTP) is:
            </p>
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">
                ${otp}
              </span>
            </div>
            <p style="color: #999; font-size: 14px; margin: 15px 0;">
              This OTP will expire in 5 minutes
            </p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #666; font-size: 13px; margin: 0;">
              <strong>Security Note:</strong> Never share this OTP with anyone. The VTU NOTE Student Study Assistant team will never ask for your OTP via email or phone.
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            If you didn't request this OTP, please ignore this email.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: subject,
      html: htmlContent
    };

    await getTransporter().sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);
    return { success: true, message: 'OTP sent to email' };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return { success: false, message: 'Failed to send OTP email' };
  }
};

// Send welcome email after successful registration
export const sendWelcomeEmail = async (email, name, userType) => {
  try {
    const subject = `Welcome to VTU NOTE Student Study Assistant - ${userType.charAt(0).toUpperCase() + userType.slice(1)} Account Created`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Welcome to VTU NOTE Student Study Assistant! 🎉</h2>
          
          <p style="color: #333; font-size: 16px; margin: 20px 0;">
            Hi <strong>${name}</strong>,
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            Your ${userType} account has been successfully created and verified. You can now access all the features of VTU NOTE Student Study Assistant.
          </p>
          
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
            <h3 style="color: #007bff; margin-top: 0;">What you can do now:</h3>
            <ul style="color: #666; font-size: 14px; line-height: 1.8;">
              ${userType === 'student' ? `
                <li>Browse and access notes from connected teachers</li>
                <li>Create your own study notes and flashcards</li>
                <li>Join study sessions and take quizzes</li>
                <li>Connect with teachers and get personalized content</li>
              ` : `
                <li>Create and publish study materials</li>
                <li>Manage your notes and share with students</li>
                <li>Track student engagement and progress</li>
                <li>Create interactive quizzes and assessments</li>
              `}
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            © ${new Date().getFullYear()} VTU NOTE Student Study Assistant. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: subject,
      html: htmlContent
    };

    await getTransporter().sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false };
  }
};

// Send study plan notification email
export const sendStudyPlanNotification = async (email, name, title, description, scheduledAt) => {
  try {
    const subject = `VTU NOTE Student Study Assistant - Study Plan Reminder: ${title}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
        <div style="background: #fff; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h2 style="color:#0B3D91">Study Plan Reminder</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>This is a reminder for your planned study session:</p>
          <p><strong>${title}</strong></p>
          <p style="color:#555">${description || ''}</p>
          <p>Scheduled at: <strong>${new Date(scheduledAt).toLocaleString()}</strong></p>
          <p style="margin-top:18px; color:#777; font-size:12px;">If you no longer need this reminder, please delete the plan from your dashboard.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject,
      html: htmlContent
    };

    await getTransporter().sendMail(mailOptions);
    console.log(`✅ Study plan notification sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending study plan notification:', error);
    return { success: false };
  }
};

export default { generateOTP, sendOTPEmail, sendWelcomeEmail, sendStudyPlanNotification };
