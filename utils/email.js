const nodemailer = require('nodemailer')

const sendEmail = async options =>{
    // 1. create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth:{
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }

    })
    // 2. Define a email option
    const mailOptions = {
        from: 'Suvendu Sahoo <suvendu.sahoo.dev@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    }
    // 3. Actually send email
    await transporter.sendMail(mailOptions)
}

module.exports = sendEmail;