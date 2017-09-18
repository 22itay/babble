


var http = require('http');
var url = require('url');
var query = require('querystring');
var md5 = require("md5");
var events = require("events");
var messages = require("./messages-util")

// event emitters
let event = new events.EventEmitter();
let statEvent = new events.EventEmitter();
event.setMaxListeners(0);
statEvent.setMaxListeners(0);

function getMessages(req, res, parsed_url) {
    console.log(parsed_url);
    let x = parsed_url.query.counter;
    console.log(x);
    if (!x || isNaN(x))
        res.end();
    else {
        console.log("good");
        console.log(x);
    }
}

function postMessage(req, res, parsed_url) {
    // https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
    // read json data (for post requests)
    let body = [];
    request.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        req.body = Buffer.concat(body).toString();
        // at this point, `body` has the entire request body stored in it as a string
        // here
    });


    //////////////////////////////////////////////
    // get message and add it to DB
    let message = req.body;
    messages.addMessage(message);
    message.imageUrl = `http://gravatar.com/avatar/${md5(message.email.trim().toLowerCase())}`;
    // notify all users
    event.emit("add", message);
    statEvent.emit("stats");

    // notify submitter
    res.json({ id: String(message.id) });
}

function deleteMessage(req, res, parsed_url) {
    Number.isInteger(+req.params.id)//"an id is required"
    messages.find(+req.params.id)//"message does not exist"
    messages.find(+req.params.id).getSender() === req.get("X-Request-Id")//"user cannot delete messages he doesn't own."

    if (messages.deleteMessage(req.params.id)) {
        emitter.emit("del", +req.params.id);//???
        statEmitter.emit("stats", "");
        res.end(JSON.stringify(true));
    } else
        res.end(JSON.stringify(false));
}

function getStats(req, res, parsed_url) {
    statEvent.once("stats", function (data) {
        res.json({
            users: users.count(),
            messages: messages.count()
        });
    });
}

http.createServer(function (req, res) {
    if (req.method == "OPTIONS") {
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

    // switch-case
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
                    // error
                    break;
            }
            break;

        case "stats":
            if (req.method == "GET") {
                get_stats(req, res, parsed_url);
            }
            else {
                // error
            }
            break;

        default:
            // 404.
            break;
    }

}).listen(9000, 'localhost');
console.log('Server running.');


function getGravatar(email) {
    return `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}`
}