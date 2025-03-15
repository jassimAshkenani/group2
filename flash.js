const persistence = require('./persistence')

async function setFlash(session, message) {
    let sd = await persistence.getSessionData(session)
    sd.flash = message
    await persistence.updateSession(sd)
}

async function getFlash(session) {
    let sd = await persistence.getSessionData(session)
    if (!sd) {
        return undefined
    }
    let result = sd.flash
    delete sd.flash
    await persistence.updateSession(sd)
    return result
}

module.exports = {
    setFlash, getFlash
}
