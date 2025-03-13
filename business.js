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


module.exports = {
    validateCredentials
}
