function addMessage(message) {

    message.id = lastMsId++;
    messages.push(message);

    // return the msId.
    return lastMsId;
}
function getMessages(counter) {
    return messages.slice(counter);
}
function deleteMessage(id) {
    let msId = messages.findIndex(ms => ms.id === +id);
    if (msId != -1) {
        messages.splice(msId, 1);
        return true;
    }
    return false;
}

module.exports = {
    addMessage: addMessage,
    getMessages: getMessages,
    deleteMessage: deleteMessage,
    count: () => messages.length
}
let lastMsId = 0;
let messages = [];
let d = { name: "String", email: "String", message: "String", timestamp: "Number(ms)" } 