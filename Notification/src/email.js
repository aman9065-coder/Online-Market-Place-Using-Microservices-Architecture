// const nodemailer = require('nodemailer');


// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         type: 'OAuth2',
//         user: process.env.EMAIL_USER,
//         clientId: process.env.CLIENT_ID,
//         clientSecret: process.env.CLIENT_SECRET,
//         refreshToken: process.env.REFRESH_TOKEN
//     }
// });

// transporter.verify((error, success) => {
//     if (error) {
//         console.log('Error connecting to mail server');
//     } else {
//         console.log('Email server is ready to send messages');
//     }
// });

// const sendmail = async (to, subject, text, html) => {
//     try {

//         const info = await transporter.sendMail({
//             from: `"YOUR NAME" <${process.env.EMAIL_USER}>`,
//             to,
//             subject,
//             text,
//             html,
//         });
//         console.log('Message sent : %s',info.messageId);
//         console.log('Preview URL: %s',nodemailer.getTestMessageUrl(info));
//     } catch (err) {
//         console.log('Error sending mail', err);
//     }
// }

// module.exports = {
//     sendmail
// }

const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendmail = async (to, subject, text, html) => {
    try {
        const sendSmtpEmail = {
            sender: { name: "Vendex Online Market", email: process.env.EMAIL_USER },
            to: [{ email: to }],
            subject,
            textContent: (text && text.trim()) ? text : "Please view this email in HTML format.",
            htmlContent: html,
        };

        const info = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Message sent:', info.messageId);
    } catch (err) {
        console.log('Error sending mail', err);
    }
}

module.exports = {
    sendmail
}