'use strict';
function addMessage(message) {
    message.id = ++lastMsId;
    messages.push(message);
    // return the msId.
    return lastMsId;
}
function getMessages(counter) {
    return messages.slice(counter)||{};
}
function deleteMessage(id) {
    let msId = messages.findIndex(ms => ms.id === +id);
    if (msId != -1) {
        messages.splice(msId, 1);
        return true;
    }
    return false;
}
function getMessageEmailbyid(id) {
    let msId = messages.findIndex(ms => ms.id === +id);
    if (msId != -1) {
        return messages[msId].email;
    }
    return "notfound";
}
let userss = new Set();

module.exports = {
    addMessage: addMessage,
    getMessages: getMessages,
    deleteMessage: deleteMessage,
    count: () => messages.length,
    users: userss,
    getMessageEmailbyid: getMessageEmailbyid
}
let lastMsId = -1;
let messages = [];