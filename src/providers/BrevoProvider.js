const brevo = require('@getbrevo/brevo');
const { env } = require('../config/environment');
let apiInstance = new brevo.TransactionalEmailsApi();

let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = env.BREVO_API_KEY

const sendEmail = async (recipientEmail, customSubject, htmlContent) => {
    let sendSmtpEmail = new brevo.SendSmtpEmail()

    sendSmtpEmail.sender = { email: env.ADMIN_EMAIL_ADDRESS, name: env.ADMIN_EMAIL_NAME }

    sendSmtpEmail.to = [{ email: recipientEmail }]
    sendSmtpEmail.subject = customSubject
    sendSmtpEmail.htmlContent = htmlContent

    //return 1 Promise
    return apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    }, function (error) {
        console.error(error);
    });
}

export const BrevoProvider = {
    sendEmail
}