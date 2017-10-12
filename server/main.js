
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
event.setMaxListeners(0);
statEvent.setMaxListeners(0);

function getMessages(req, res, parsed_url) {
    console.log("getMessages_s");
    let x = parsed_url.query.counter;
    console.log(x);
    if (!x || isNaN(x)){
        res.statusCode =405;
        return res.end();
    }
    else {
        res.statusCode =200;
        if (messages.count() > +x)
            res.end(JSON.stringify(messages.getMessages(+x)));
        else {
            event.once("deleteMS", function (mesId) {
                res.end(JSON.stringify({ delete: true, id: mesId }));
            });
            event.once("addMS", function (mes) {
                res.end(JSON.stringify([mes]));
            });
        }
        statEvent.emit("upStats", "");
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
        req.body = JSON.parse(body);
        console.log("data-")
        console.log(req.body);
        messages.addMessage(req.body);
        let message = req.body;
        //message.uid = req.headers("X-Request-Id");
        //messages.setSender(message.id, message.uid);//////
        message.imageUrl =getGravatar(message.email);
     
        // notify all
        event.emit("addMS", message);
        statEvent.emit("upStats");
    
        // notify sender
        res.write(JSON.stringify({ id: String(message.id) }));
        res.statusCode =200;
        res.end();
        console.log("postMessage_end");
    });
}

function deleteMessage(req, res, parsed_url) {
    console.log("deleteMessage_s");
    let id=+parsed_url.parts[1];
    console.log(id);
    if(!Number.isInteger(id)){
        res.statusCode=405;
        return res.end(JSON.stringify(false));
    }

   // messages.find(id).getSender() === req.get("X-Request-Id")//"user cannot delete messages he doesn't own."

    res.statusCode=200;
    if (messages.deleteMessage(id)) {
        event.emit("deleteMS", id);
        res.end(JSON.stringify(true));
      
    } else
        res.end(JSON.stringify(false));

}

function getStats(req, res, parsed_url) {
    statEvent.once("upStats", function (data) {
        res.statusCode=200;
        res.end(JSON.stringify(
            {
                users: messages.users.size,
                messages: messages.count()
            }
        ));
    });
  
    console.log("getStats_end");
}
function login(req, res, parsed_url) {
    console.log("login_s");
   messages.users.add();//email
    statEvent.emit("upStats", "");
    res.statusCode =200;
    res.end();
    console.log("login_end");
}
function logout(req, res, parsed_url) {
    //users.delete(req.body.uid);
    messages.users.delete();//email
    statEvent.emit("upStats", "");
    console.log("logout_s");
    res.end();
    console.log("logout_end");
}

http.createServer(function (req, res) {
    res.setHeader('Access-Control-Allow-Origin','*');
    if (req.method == "OPTIONS") {
        console.log("OPTIONS ://");//console.log(url.parse(req.url));
        res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'x-request-id,Content-Type, Authorization, Content-Length, X-Requested-With,Access-Control-Allow-Headers,Access-Control-Request-Method');   
        res.statusCode = 204;
        return res.end();
    }
    // url parsing
    let parsed_url = url.parse(req.url);
    parsed_url.query = query.parse(parsed_url.query);
    parsed_url.parts = parsed_url.pathname.split("/").filter(item => item);

    // 
    if (parsed_url.parts.length < 1)
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
            else{
                res.statusCode = 405;
                return res.end();
            }
            break;
        case "login":
            if (req.method == "POST")
                login(req, res, parsed_url);
            else{
                res.statusCode = 405;
                return res.end();
            }
        case "logout":
            if (req.method == "POST") 
                logout(req, res, parsed_url);
            else{
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