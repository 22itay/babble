
'use strict';

let http = require('http');
let url = require('url');
let query = require('querystring');
let md5 = require("md5");
let events = require("events");
let messages = require("./messages-util")

// event emitters
let event = new events.EventEmitter();
let statEvent = new events.EventEmitter();
event.setMaxListeners(Infinity);
statEvent.setMaxListeners(Infinity);

function getMessages(req, res, parsed_url) {
    let x = parsed_url.query.counter;
    if (!x || isNaN(x)) {
        res.statusCode = 400;
        return res.end();
    }
    else {
        res.statusCode = 200;
        if (messages.count() > +x)
            res.end(JSON.stringify(messages.getMessages(+x)));
        else {
            event.once("addMS", function (mes) {
                res.end(JSON.stringify([mes]));
            });
            event.once("deleteMS", function (id) {
                res.end(JSON.stringify({ delete: true, msid: id }));
            });
        }
    }
}

function postMessage(req, res, parsed_url) {
    // https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
    // read json data (for post requests)
    console.log("postMessage_s");
    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6)
            request.connection.destroy();
    }).on('end', () => {
        // at this point, `body` has the entire request body stored in it as a string
        // here
        body = Buffer.concat(body).toString();
        let message = JSON.parse(body);
        message.imageUrl = getGravatar(message.email);
        messages.addMessage(message);
        // notify all
        event.emit("addMS", message);
        statEvent.emit("upStats");
        // notify sender
        res.statusCode = 200;
        res.end(JSON.stringify({ id: String(message.id) }));
    });
}

function deleteMessage(req, res, parsed_url) {
    console.log("deleteMessage_s");
    let id = +parsed_url.parts[1];
    console.log(id);
    console.log(req.headers["x-request-id"]);
    let email = req.headers["x-request-id"];
    email = email.length > 2 ? email : " ";
    if (!Number.isInteger(id) || email !== messages.getMessageEmailbyid(id)) {
        res.statusCode = 400;
        return res.end(JSON.stringify(false));
    }

    res.statusCode = 200;
    if (messages.deleteMessage(id)) {
        event.emit("deleteMS", id);
        statEvent.emit("upStats");
        res.end(JSON.stringify(true));

    } else
        res.end(JSON.stringify(false));

}

function getStats(req, res, parsed_url) {
    statEvent.once("upStats", function (data) {
        res.statusCode = 200;
        res.end(JSON.stringify(
            {
                users: messages.users.size,
                messages: messages.count()
            }
        ));
    });
}
function login(req, res, parsed_url) {
    console.log("login");
    let id = req.headers["x-request-id"];
    id = id.length > 2 ? id : "anno";
    messages.users.add(id);//email
    console.log(messages.users);
    statEvent.emit("upStats");
    res.statusCode = 200;
    res.end();
}
function logout(req, res, parsed_url) {
    console.log("logout");
    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6)
            request.connection.destroy();
    }).on('end', () => {
        // at this point, `body` has the entire request body stored in it as a string
        // here
        body = Buffer.concat(body).toString();
        let email = JSON.parse(body).email;
        email = email.length > 2 ? email : "anno";
        messages.users.delete(email);//email
        console.log(messages.users);
        statEvent.emit("upStats");
        res.statusCode = 200;
        res.end();
    });

}

http.createServer(function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method == "OPTIONS") {
        //console.log("OPTIONS ://");//console.log(url.parse(req.url));
        res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'x-request-id,Content-Type, Authorization, Content-Length, X-Requested-With,Access-Control-Allow-Headers,Access-Control-Request-Method');
        res.statusCode = 204;
        return res.end();
    }

    // setTimeout(function () {
    //     console.log("timeout timeout");
    //     console.log(req.url);        
    //     res.statusCode = 202;
    //     res.end(JSON.stringify({timeout:true}));
    // }, 2 * 60 * 1000);

    // url parsing
    let parsed_url = url.parse(req.url);
    parsed_url.query = query.parse(parsed_url.query);
    parsed_url.parts = parsed_url.pathname.split("/").filter(item => item);

    // 
    res.statusCode = 404;
    if (parsed_url.parts.length < 1)
        return res.end();
    if (parsed_url.parts.length > 1 && req.method != "DELETE" && parsed_url.parts[0] != messages)
        return res.end();
    //default init statusCode

    switch (parsed_url.parts[0]) {
        case "messages":
            switch (req.method) {
                case "GET":
                    getMessages(req, res, parsed_url);
                    break;
                case "POST":
                    postMessage(req, res, parsed_url);
                    break;
                case "DELETE":
                    deleteMessage(req, res, parsed_url);
                    break;
                default:
                    res.statusCode = 405;
                    return res.end();
                    break;
            }
            break;

        case "stats":
            if (req.method == "GET")
                getStats(req, res, parsed_url);
            else {
                res.statusCode = 405;
                return res.end();
            }
            break;
        case "login":
            if (req.method == "POST")
                login(req, res, parsed_url);
            else {
                res.statusCode = 405;
                return res.end();
            }
            break;
        case "logout":
            if (req.method == "POST")
                logout(req, res, parsed_url);
            else {
                res.statusCode = 405;
                return res.end();
            }
        default:
            res.statusCode = 404;
            return res.end();
            break;
    }


}).listen(9000, 'localhost');
console.log('Server running.');


function getGravatar(email) {
    return `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}`
}