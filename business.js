const persistence = require('./persistence')
const crypto = require("crypto")

async function validateCredentials(username, password) {
    let check = await persistence.getUserDetails(username)
    let hash = crypto.createHash('sha256')
    hash.update(password)
    let hashedPassword = hash.digest('hex')
    if (!check) {
        return false
    }
    if (check.verified === false){
        return false
    }
    if (check.password != hashedPassword) {
        return false
    }
    return check
}

async function startSession(data) {
    let uuid = crypto.randomUUID()
    let expiry = new Date(Date.now() + 1000 * 60 * 10)
    await persistence.saveSession(uuid, expiry, data)
    return {
        uuid: uuid,
        expiry: expiry
    }
}

async function getSessionData(key) {
    return await persistence.getSessionData(key)
}

async function deleteSession(key) {
    await persistence.deleteSession(key)
}

async function saveNewUser(newUser) {
    let hash = crypto.createHash('sha256')
    hash.update(newUser.password)
    let hashedPassword = hash.digest('hex')
    newUser.password = hashedPassword
    await persistence.saveNewUser(newUser)
}

async function checkOTP(username, otp) {
    return await persistence.checkOTP(username,otp)
}

module.exports = {
    validateCredentials, startSession, getSessionData, deleteSession, saveNewUser, checkOTP
}
