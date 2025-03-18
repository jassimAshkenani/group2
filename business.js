const persistence = require('./persistence')
const crypto = require("crypto")


/**
 * Validates user credentials by checking username, password, and account verification status.
 * @param {string} username - The username of the user.
 * @param {string} password - The plain-text password of the user.
 * @returns {Object} - Returns user details if credentials are valid; otherwise, false.
 */
async function validateCredentials(username, password) {
    let check = await persistence.getUserDetails(username)
    let hash = crypto.createHash('sha256')
    hash.update(password)
    let hashedPassword = hash.digest('hex')
    if (!check) {
        return false
    }
    if (check.verified === false) {
        return false
    }
    if (check.password != hashedPassword) {
        return false
    }
    return check
}

/**
 * Starts a new user session by generating a UUID and setting an expiry time.
 * @param {Object} data - Session data including username and user type.
 * @returns {Object} - The session UUID and expiry date.
 */
async function startSession(data) {
    let uuid = crypto.randomUUID()
    let expiry = new Date(Date.now() + 1000 * 60 * 10)
    await persistence.saveSession(uuid, expiry, data)
    return {
        uuid: uuid,
        expiry: expiry
    }
}


/**
 * Retrieves session data based on the provided session key.
 * @param {string} key - The session key (UUID).
 * @returns {Object} - The session data found.
 */
async function getSessionData(key) {
    return await persistence.getSessionData(key)
}

/**
 * Deletes a session based on the provided session key.
 * @param {string} key - The session key (UUID).
 */
async function deleteSession(key) {
    await persistence.deleteSession(key)
}


/**
 * Saves a new user's information in the database after hashing their password.
 * @param {Object} newUser - The new user object containing user details.
 */
async function saveNewUser(newUser) {
    let hash = crypto.createHash('sha256')
    hash.update(newUser.password)
    let hashedPassword = hash.digest('hex')
    newUser.password = hashedPassword
    await persistence.saveNewUser(newUser)
}

/**
 * Checks if the provided OTP is valid for a specific user.
 * @param {string} username - The username of the user.
 * @param {number} otp - The OTP to validate.
 * @returns {boolean} - Returns true if the OTP is valid, otherwise false.
 */
async function checkOTP(username, otp) {
    return await persistence.checkOTP(username, otp)
}

module.exports = {
    validateCredentials, startSession, getSessionData, deleteSession, saveNewUser, checkOTP
}
