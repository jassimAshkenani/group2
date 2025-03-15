const mongodb = require('mongodb')

let client = undefined
let db = undefined
let users = undefined
let session = undefined
let requests = undefined

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

async function getUserDetails(username) {
    await connectDatabase()
    let result = await users.find({username: username})
    let resultData = await result.toArray()
    return resultData[0]
}

async function saveSession(uuid, expiry, data) {
    await connectDatabase()
    await session.insertOne({
        SessionKey: uuid,
        Expiry: expiry,
        Data: data
    })
}

async function getSessionData(key) {
    await connectDatabase()
    let result = await session.find({SessionKey: key})
    let resultData = await result.toArray()
    return resultData[0]
}

async function deleteSession(key) {
    await session.deleteOne({SessionKey: key})
}

async function updateSession(sd){
    await connectDatabase()
    await session.updateOne({SessionKey:sd.SessionKey},{$set:{flash:sd.flash}})
}


async function saveNewUser(newUser){
    await connectDatabase()
    await users.insertOne(newUser)


}


module.exports={
    getUserDetails, saveSession, getSessionData, deleteSession,
    updateSession, saveNewUser
}