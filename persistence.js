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

module.exports={
    getUserDetails
}
