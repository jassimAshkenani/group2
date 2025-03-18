//This file is just for demo on how the actual email verification would work like.

const nodemailer = require('nodemailer')


let transporter = nodemailer.createTransport({
    host: "127.0.0.1",
    port: 25
})

async function testmail(email, code) {
    let body = `
    Your One Time Passcode is ${code}. Please enter this code to the link provided below.
    Please click <a href='http://127.0.0.01:8000/verify-email'>Here</a> to verify your email
    `
    await transporter.sendMail({
        from: "emailVerification@udst.edu.qa",
        to: email,
        subject: "Verify email",
        html: body
    })
}

module.exports = {
    testmail
}
