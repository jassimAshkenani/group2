const express=require('express')
const bodyParser = require('body-parser')
const handlebars = require('express-handlebars')
const cookieParser = require('cookie-parser')
const business = require('./business')
const flash = require('./flash.js')
const fileUpload = require('express-fileupload')
const verifyEmail = require('./emailVerification.js')

app = express()
app.set('views', __dirname+"/templates")
app.set('view engine', 'handlebars')
app.engine('handlebars', handlebars.engine())
let urlencodedParser = bodyParser.urlencoded({extended: false})
app.use('/css', express.static(__dirname+'/css'))
app.use('/vendors', express.static(__dirname+'/vendors'))
app.use('/assets', express.static(__dirname+'/assets'))
app.use(urlencodedParser)
app.use(cookieParser())
app.use(fileUpload())
app.use(bodyParser.json())


app.get('/', async (req, res)=>{
    res.redirect('/login')
})
app.get('/login', async (req, res) => {
    let key = req.cookies.session
    let message = await flash.getFlash(key)
    if (!message){
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
        message:message,
        layout: undefined
    })
})

app.post('/login', async (req,res) => {
    let username = req.body.username
    let password = req.body.password
    let result = await business.validateCredentials(username,password)
    if (result){
        let session = await business.startSession({
            username: username,
            userType: result.type
        })
        res.cookie('session', session.uuid, {expires: session.expiry})
    
        if (result.type == 'admin') {
            res.redirect('/admin')
            return
        }
        else if (result.type == 'student') {
            res.redirect('/student')
            return
        }
    }
    let key = await business.startSession({username:"",userType:""})
    res.cookie('session', key.uuid, {expires: key.expiry})
    await flash.setFlash(key.uuid, "Invalid Credentials or unverified account")
    res.redirect('/login')
})

app.get('/register', (req, res) => {
    let message = req.query.message
    res.render('register', { message, layout: undefined });
});



app.post('/register', async (req, res) => {
    let name = req.body.name
    let phone = req.body.phone
    let degree = req.body.degree
    let email = req.body.email
    let username = req.body.username
    let password = req.body.password
    let repeatPassword = req.body.repeatPassword
    let type= req.body.type
    if (password != repeatPassword || !username || !password || !phone || !name || !degree || !email){
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
        verified:false,
        otp
    }
    console.log(otp)

    await business.saveNewUser(newUser)

    res.redirect(`/verify-email/${username}`)

})

app.get("/verify-email/:username", async(req, res) =>{
    let username = req.params.username
    res.render('verifyEmail',{
        username,
        layout:undefined
    })
})

app.post("/verify-email/:username", async(req, res) =>{
    let otp = Number(req.body.otp)
    let username = req.params.username
    let verification = await business.checkOTP(username, otp)
    if (verification){
        res.redirect("/login?message=Your account is verified, you can now login")
    }
    else{  
        res.redirect("/login?message=Your account is not verified yet")
    }
})

app.get('/logout', async (req, res) => {
    await business.deleteSession(req.cookies.session)
    res.cookie('session', '', {expires: new Date(Date.now())})
    res.redirect('/')
})
app.listen(8000, () => {
    console.log("Application started")
})
