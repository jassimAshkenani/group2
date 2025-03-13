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


app.get('/logout', async (req, res) => {
    await business.deleteSession(req.cookies.session)
    res.cookie('session', '', {expires: new Date(Date.now())})
    res.redirect('/')
})
app.listen(8000, () => {
    console.log("Application started")
})
