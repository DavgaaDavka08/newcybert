// src/lib/email.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendResetPasswordEmail(to: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"CyberPhysics" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Нууц үг сэргээх — CyberPhysics",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #07070D; margin: 0; padding: 0; }
          .container { max-width: 520px; margin: 40px auto; background: #13131F; border-radius: 20px;
            overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
          .header { background: linear-gradient(135deg, #FFD23F, #5ECEBA); padding: 32px; text-align: center; }
          .header h1 { margin: 0; color: #07070D; font-size: 24px; font-weight: 900; }
          .body { padding: 36px 32px; color: #E2E8F0; }
          .body p { line-height: 1.7; color: #94A3B8; margin-bottom: 16px; }
          .btn { display: block; width: fit-content; margin: 24px auto; padding: 14px 32px;
            background: #FFD23F; color: #07070D; font-weight: 800; font-size: 15px;
            border-radius: 12px; text-decoration: none; }
          .footer { padding: 20px 32px; text-align: center; color: #475569; font-size: 12px;
            border-top: 1px solid rgba(255,255,255,0.06); }
          .expire { background: rgba(255,210,63,0.1); border: 1px solid rgba(255,210,63,0.2);
            border-radius: 8px; padding: 10px 16px; font-size: 13px; color: #FFD23F;
            margin-top: 16px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚡ CyberPhysics</h1>
          </div>
          <div class="body">
            <h2 style="color:#E2E8F0; margin-top:0">Нууц үг сэргээх</h2>
            <p>Та нууц үг сэргээх хүсэлт илгээсэн байна. Доорх товчийг дарж нууц үгээ шинэчлэнэ үү.</p>
            <a href="${resetUrl}" class="btn">🔐 Нууц үг сэргээх</a>
            <div class="expire">⏰ Холбоос 1 цагийн дотор хүчинтэй</div>
            <p style="margin-top:20px; font-size:13px;">
              Хэрэв та энэ хүсэлт илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.
            </p>
          </div>
          <div class="footer">
            © 2024 CyberPhysics — Физикийг тоглоомоор сур
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  await transporter.sendMail({
    from: `"CyberPhysics" <${process.env.GMAIL_USER}>`,
    to,
    subject: "CyberPhysics-д тавтай морилно уу! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #07070D; margin: 0; padding: 0; }
          .container { max-width: 520px; margin: 40px auto; background: #13131F; border-radius: 20px;
            overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
          .header { background: linear-gradient(135deg, #FFD23F, #5ECEBA); padding: 32px; text-align: center; }
          .body { padding: 36px 32px; color: #E2E8F0; }
          .body p { line-height: 1.7; color: #94A3B8; }
          .features { background: rgba(255,255,255,0.04); border-radius: 12px; padding: 20px;
            margin: 20px 0; }
          .feature { display: flex; gap: 12px; margin-bottom: 12px; align-items: center; }
          .btn { display: block; width: fit-content; margin: 24px auto; padding: 14px 32px;
            background: #FFD23F; color: #07070D; font-weight: 800; font-size: 15px;
            border-radius: 12px; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;color:#07070D;font-size:28px;font-weight:900">⚡ CyberPhysics</h1>
            <p style="margin:8px 0 0;color:#07070D;opacity:0.7">Физикийг тоглоомоор сур</p>
          </div>
          <div class="body">
            <h2 style="color:#FFD23F;margin-top:0">Сайн байна уу, ${firstName}! 👋</h2>
            <p>CyberPhysics платформд тавтай морилно уу! Та физикийн ертөнцийг судалж эхлэхэд бэлэн боллоо.</p>
            <div class="features">
              <div class="feature"><span>🎮</span><span>Duolingo загвартай XP тоглоом</span></div>
              <div class="feature"><span>🤖</span><span>AI тайлбартай бодлогууд</span></div>
              <div class="feature"><span>🏆</span><span>Streak систем ба coinуud</span></div>
              <div class="feature"><span>📊</span><span>Дэвшлийн дэлгэрэнгүй тайлан</span></div>
            </div>
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="btn">🚀 Эхлэцгээе!</a>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
