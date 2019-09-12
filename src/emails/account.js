const sgMail = require('@sendgrid/mail')
require('dotenv').config()

sgMail.setApiKey(process.env.SENDGRID_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'sjr.bkk@gmail.com',
        subject: 'Welcome to the Task Manager',
        text: `Welcome to the app, ${name}. I hope it's useful!`
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'sjr.bkk@gmail.com',
        subject: `Sorry to see you go, ${name}`,
        text: 'Thank you for using the Task Manager, if there\'s anything we can improve on please let us know and if we can help in the future please feel free to re-register.'
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}