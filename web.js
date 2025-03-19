const express = require('express')
const bodyParser = require('body-parser')
const handlebars = require('express-handlebars')
const cookieParser = require('cookie-parser')
const business = require('./business')
const flash = require('./flash.js')
const verifyEmail = require('./emailVerification.js')

app = express()
app.set('views', __dirname + "/templates")
app.set('view engine', 'handlebars')
app.engine('handlebars', handlebars.engine())
let urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use('/css', express.static(__dirname + '/css'))
app.use('/vendors', express.static(__dirname + '/vendors'))
app.use('/assets', express.static(__dirname + '/assets'))
app.use(urlencodedParser)
app.use(cookieParser())
app.use(bodyParser.json())

/**
 * Redirects to the login page.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/', async (req, res) => {
    res.redirect('/login')
})

/**
 * Renders the login page or redirects based on session data.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/login', async (req, res) => {
    let key = req.cookies.session
    let message = await flash.getFlash(key)
    if (!message) {
        message = req.query.message
    }
    let sd = undefined
    if (key) {
        sd = await business.getSessionData(key)
    }
    if (sd && sd.Data.username != "") {
        res.redirect(`/${sd.Data.userType}`)
        return
    }
    res.render('login', {
        message: message,
        layout: undefined
    })
})


/**
 * Handles login requests, validates credentials, and starts a session.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.post('/login', async (req, res) => {
    let username = req.body.username
    let password = req.body.password
    let result = await business.validateCredentials(username, password)
    if (result) {
        let session = await business.startSession({
            username: username,
            userType: result.type
        })
        res.cookie('session', session.uuid, { expires: session.expiry })

        if (result.type == 'admin') {
            res.redirect('/admin')
            return
        }
        else if (result.type == 'student') {
            res.redirect('/student')
            return
        }
    }
    let key = await business.startSession({ username: "", userType: "" })
    res.cookie('session', key.uuid, { expires: key.expiry })
    await flash.setFlash(key.uuid, "Invalid Credentials or unverified account")
    res.redirect('/login')
})


/**
 * Renders the registration page.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/register', (req, res) => {
    let message = req.query.message
    res.render('register', { message, layout: undefined });
});


/**
 * Handles user registration and generates an OTP for email verification.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.post('/register', async (req, res) => {
    let name = req.body.name
    let phone = req.body.phone
    let degree = req.body.degree
    let email = req.body.email
    let username = req.body.username
    let password = req.body.password
    let repeatPassword = req.body.repeatPassword
    let type = req.body.type
    if (password != repeatPassword || !username || !password || !phone || !name || !degree || !email) {
        res.redirect('/register?message=Incorrect or missing information')
        return
    }
    let otp = Math.floor(1000 + Math.random() * 9000);
    let newUser = {
        name,
        phone,
        degree,
        email,
        username,
        password,
        type,
        verified: false,
        otp
    }
    console.log(`Your OTP for registering your account is: ${otp}`)

    await business.saveNewUser(newUser)

    res.redirect(`/verify-email/${username}`)

})


/**
 * Renders the email verification page.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get("/verify-email/:username", async (req, res) => {
    let username = req.params.username
    res.render('verifyEmail', {
        username,
        layout: undefined
    })
})

/**
 * Handles email verification by OTP.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.post("/verify-email/:username", async (req, res) => {
    let otp = Number(req.body.otp)
    let username = req.params.username
    let verification = await business.checkOTP(username, otp)
    if (verification) {
        res.redirect("/login?message=Your account is verified, you can now login")
    }
    else {
        res.redirect("/login?message=Your account is not verified yet")
    }
})


/**
 * Renders the student dashboard if authenticated.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/student', async (req, res) => {
    let sessionKey = req.cookies.session
    if (!sessionKey) {
        let key = await business.startSession({ username: "", userType: "" })
        res.cookie('session', key.uuid, { expires: key.expiry })
        await flash.setFlash(key.uuid, "Unauthorized Access")
        res.redirect("/login")
        return
    }
    let sessionData = await business.getSessionData(sessionKey)
    if (!sessionData) {
        let key = await business.startSession({ username: "", userType: "" })
        res.cookie('session', key.uuid, { expires: key.expiry })
        await flash.setFlash(key.uuid, "Unauthorized Access")
        res.redirect("/login")
        return
    }

    if (sessionData.Data.userType !== 'student') {
        let key = await business.startSession({ username: "", userType: "" })
        res.cookie('session', key.uuid, { expires: key.expiry })
        await flash.setFlash(key.uuid, "Unauthorized Access")
        res.redirect("/login")
        return
    }
    let message = await flash.getFlash(sessionKey)
    res.render('student', {
        m: message,
        layout: undefined
    })
})


/**
 * Renders the admin dashboard if authenticated.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/admin', async (req, res) => {
    let sessionKey = req.cookies.session
    if (!sessionKey) {
        let key = await business.startSession({ username: "", userType: "" })
        res.cookie('session', key.uuid, { expires: key.expiry })
        await flash.setFlash(key.uuid, "Unauthorized Access")
        res.redirect("/login")
        return
    }
    let sessionData = await business.getSessionData(sessionKey)
    if (!sessionData) {
        let key = await business.startSession({ username: "", userType: "" })
        res.cookie('session', key.uuid, { expires: key.expiry })
        await flash.setFlash(key.uuid, "Unauthorized Access")
        res.redirect("/login")
        return
    }

    if (sessionData.Data.userType !== 'admin') {
        let key = await business.startSession({ username: "", userType: "" })
        res.cookie('session', key.uuid, { expires: key.expiry })
        await flash.setFlash(key.uuid, "Unauthorized Access")
        res.redirect("/login")
        return
    }
    let message = await flash.getFlash(sessionKey)
    res.render('admin', {
        m: message,
        layout: undefined
    })
})


/**
 * Logs out the user and clears the session cookie.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/logout', async (req, res) => {
    await business.deleteSession(req.cookies.session)
    res.cookie('session', '', { expires: new Date(Date.now()) })
    res.redirect('/')
})


/**
 * Starts the server and listens on port 8000.
 */
app.listen(8000, () => {
    console.log("Application started")
})
