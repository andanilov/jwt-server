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

  async sendResetPasswordLinkMail(to, link, ip) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `Запрос на сброс пароля ${process.env.PROJECT_NAME}`,
      text: '',
      html: 
        `
          <div>
            <h1>${process.env.PROJECT_NAME}</h1>
            <h2>Здравствуйте, с IP: ${ip} поступил запрос на сброс пароля.</h2>
            <a href="${link}">Сбросить пароль!</a>
          </div>
        `
    });
  }

  async sendNewPasswordMail(to, pswd) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `Новый пароль ${process.env.PROJECT_NAME}`,
      text: '',
      html: 
        `
          <div>
            <h1>${process.env.PROJECT_NAME}</h1>
            <h2>Здравствуйте, Ваш пароль был изменён.</h2>
            <h2>Новый пароль: ${pswd}</h2>
            <p>Рекомендуем заменить данный пароль в Личном кабинете.</p>
          </div>
        `
    });
  }
}

module.exports = new MainService();
