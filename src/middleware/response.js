const buildResponse = (success, message, data = {}) => {
    return { success, message, data }
}

module.exports = buildResponse