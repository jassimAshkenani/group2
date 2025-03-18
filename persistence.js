const mongodb = require('mongodb')

let client = undefined
let db = undefined
let users = undefined
let session = undefined
let requests = undefined


/**
 * Connects to the MongoDB database and initializes the collections.
 */
async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient('mongodb+srv://jassim:60106379@cluster0.camh6.mongodb.net/')
        await client.connect()
        db = client.db('project')
        users = db.collection('user')
        session = db.collection('session')
        requests = db.collection('request')
    }
}


/**
 * Retrieves user details based on the provided username.
 * @param {string} username - The username to look up.
 * @returns {Object} - Returns the user details if found, otherwise null.
 */
async function getUserDetails(username) {
    await connectDatabase()
    let result = await users.find({ username: username })
    let resultData = await result.toArray()
    return resultData[0]
}


/**
 * Saves a session in the database.
 * @param {string} uuid - The unique session key.
 * @param {Date} expiry - The expiry date of the session.
 * @param {Object} data - The session data.
 */
async function saveSession(uuid, expiry, data) {
    await connectDatabase()
    await session.insertOne({
        SessionKey: uuid,
        Expiry: expiry,
        Data: data
    })
}

/**
 * Retrieves session data based on the session key.
 * @param {string} key - The session key.
 * @returns {Object} - Returns the session data if found, otherwise null.
 */
async function getSessionData(key) {
    await connectDatabase()
    let result = await session.find({ SessionKey: key })
    let resultData = await result.toArray()
    return resultData[0]
}

/**
 * Deletes a session from the database based on the session key.
 * @param {string} key - The session key.
 */
async function deleteSession(key) {
    await session.deleteOne({ SessionKey: key })
}

/**
 * Updates session data with the flash message information.
 * @param {Object} sd - The session data object containing SessionKey and the flash message.
 */
async function updateSession(sd) {
    await connectDatabase()
    await session.updateOne({ SessionKey: sd.SessionKey }, { $set: { flash: sd.flash } })
}

/**
 * Saves a new user's details in the database.
 * @param {Object} newUser - The new user object containing user details.
 */
async function saveNewUser(newUser) {
    await connectDatabase()
    await users.insertOne(newUser)


}

/**
 * Checks if the provided OTP matches the one stored for a user and updates their verification status.
 * @param {string} username - The username to check the OTP for.
 * @param {number} otp - The OTP to validate.
 * @returns {boolean} - Returns true if the OTP is valid, otherwise false.
 */
async function checkOTP(username, otp) {
    await connectDatabase()
    let result = await users.findOne({ username: username })
    if (result && (result.otp === otp)) {
        await users.updateOne({ username: username }, { $set: { verified: true } })
        return true
    }
    return false
}



module.exports = {
    getUserDetails, saveSession, getSessionData, deleteSession,
    updateSession, saveNewUser, checkOTP
}