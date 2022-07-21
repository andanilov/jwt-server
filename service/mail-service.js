const nodemailer = require('nodemailer');

class MainService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,   
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
    });
  }

  async sendActiovationMail(to, link) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `Активация аккаунта для ${process.env.PROJECT_NAME}`,
      text: '',
      html: 
        `
          <div>
            <h1>${process.env.PROJECT_NAME}</h1>
            <h2>Для активации перейдите по ссылке</h2>
            <a href="${link}">Активировать аккаунт!</a>
          </div>
        `
    });
  }
}

module.exports = new MainService();
