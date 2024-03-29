const crypto = require('crypto');
const nodemailer = require('nodemailer');
const hashService = require('./hash-service');
const smsSid = process.env.SMS_SID;
const smsAuthToken = process.env.SMS_AUTH_TOKEN;
const twilio = require('twilio')(smsSid, smsAuthToken, {
    lazyLoading: true
});

class OtpService {
    async generateOtp() {
        const otp = crypto.randomInt(1000, 9999);
        return otp;
    }

    async sendBySms(phone, otp) {
        return await twilio.messages.create({
            to: phone,
            from: process.env.SMS_FROM_NUMBER,
            body: `Your VoiceClub OTP is ${otp}, this OTP is valid for 5 minutes.`
        });
    }

    verifyOtp(hashOtp, data) {
        let computedHash = hashService.hashOtp(data);
        return hashOtp === computedHash;
    }


    async sendByEmail(mail, otp) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            secure: false,
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        const mailOptions = {
            from: process.env.EMAIL_ID,
            to: mail,
            subject: 'OTP to access voiceclub',
            text: `Hey your otp to access voiceclub is ${otp}`
        };

        return await transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }
}

module.exports = new OtpService();
