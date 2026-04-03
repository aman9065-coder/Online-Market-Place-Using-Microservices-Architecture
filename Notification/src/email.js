
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.log('Error connecting to mail server');
    } else {
        console.log('Email server is ready to send messages');
    }
});

const sendmail = async (to, subject, text, html) => {
    try {

        const info = await transporter.sendMail({
            from: `"YOUR NAME" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log('Message sent : %s',info.messageId);
        console.log('Preview URL: %s',nodemailer.getTestMessageUrl(info));
    } catch (err) {
        console.log('Error sending mail', err);
    }
}

module.exports = {
    sendmail
}