'use strict';
var Babble = {
    counter: 0,
    sessionData: {
        currentMessage: "",
        userInfo: {
            name: "",
            email: ""
        },
        uid: ""
    },
    register: function (userInfo) {//userInfo:Object

    },
    getMessages: function (counter, callback) {//counter:Number, callback:Function
        Babble.request({
            method: 'GET',
            action: '/messages',
            request_id: Babble.sessionData.uid,
            data: ''
        }).then(function(data) {
            callback(data);
          });
    },
    postMessage: function (message, callback) {//message:Object, callback:Function
        Babble.request({
            method: 'POST',
            action: '/messages?counter=' + counter,
            request_id: Babble.sessionData.uid,
            data: message//"{name:String, email:String, message:String, timestamp:Number(ms)}"
        }).then(function(data) {
            callback(data);
          });
    },
    deleteMessage: function (id, callback) {//id:String, callback:Function
        Babble.request({
            method: 'DELETE',
            action: '/messages/:' + id,
            request_id: Babble.sessionData.uid,
            data: ''
        }).then(function(data) {
            callback(data);
          });
    },
    getStats: function (callback) {//Function
        Babble.request({
            method: 'GET',
            action: '/stats',
            request_id: Babble.sessionData.uid,
            data: ''
        }).then(function(data) {
            callback(data);
          });
    }
    , request: function (options) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            
            xhr.open(options.method, Babble.host+options.action);
           
            if (options.method === 'post') {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }
            if (options.request_id) {
                xhr.setRequestHeader("X-Request-Id", options.request_id);
            }
            xhr.withCredentials=false;
            xhr.addEventListener('load', e => {
                resolve(e.target.responseText);
            });
            xhr.send(options.data);
        });
    }

}; 
 Babble.host = "http://localhost:9000";
 let lastSession = JSON.parse(localStorage.getItem("babble"));
 if (lastSession)
 Babble.sessionData = lastSession;

       // generate UUID if you have none.
       //TODO

    // if noting is in the local storage
if (localStorage.getItem("babble") === null) {
    localStorage.setItem('babble', JSON.stringify(Babble.sessionData));
}
Babble.register=function (userInfo) {
    Babble.request({
        method: 'POST',
        action: '/login',
        data: JSON.stringify({ uid:Babble.sessionData.uid })
    });
    Babble.sessionData.userInfo.name = userInfo.name;
    Babble.sessionData.userInfo.email = userInfo.email;
    localStorage.setItem('babble', JSON.stringify(Babble.sessionData));
};
Babble.polling= function(){
    Babble.getMessages(Babble.counter, function (data) {
        console.log(data);
        if (data.delete)
            deleteMessageDOM(data.id);
        else 
        {
            // update internal counter
            Babble.counter += data.length;
            // visuallly display on the DOM
            data.forEach(function (message) {
                addMessageDOM(message);
            });
        }
        // call the next long poll
        Babble.polling();
    });
}


Babble.polling2= function(){
        window.Babble.getStats(function (data) {
        window.Babble.statsMessages.innerHTML = data.messages;
        window.Babble.statsPeople.innerHTML = data.users;

        polling2();
    });
}

 Babble.sendMessage= function(e, textarea) {
    e.preventDefault(); // prevent refresh

    if (textarea.value == "") {
        alert("You can't have an empty message");
        return;
    }

    let message ={
        name: session.userInfo.name,
        email: session.userInfo.email,
        message: textarea.value,
        timestamp: Date.now().toString(),
        id: 0
    };
    Babble.postMessage(message, function (data) {
        textarea.value = "";
        textarea.style.height = "auto";
    });
}
function onloadP(){

    // signup dialog
    let loginBtn = document.getElementById("js-loginBtn");
    let anonBtn = document.getElementById("js-stayAnonBtn");
    let newMsgForm = document.getElementById("js-newMessage-form");//todo
    let textarea = document.getElementById("newMessage-contents");//todo
    
    loginBtn.addEventListener("click", function (e) {
        e.preventDefault();
        Babble.register({
            name: document.getElementById("signup-fullname").value,
            email: document.getElementById("signup-email").value
        });
        Babble.polling2();
        Babble.polling();
        document.getElementById("js-signupDialog").classList.add("u-hidden");
    });

   

    
    newMsgForm.addEventListener("submit", e => sendMessage(e, textarea));
    autoResize(textarea, 100, 300);
    // unload event listener
    window.addEventListener('beforeunload', function (event) {
        Babble.sessionData.currentMessage = textarea.value;
        localStorage.setItem('babble', JSON.stringify(Babble.sessionData));
        navigator.sendBeacon("http://localhost:9000/logout", JSON.stringify({ uid: Babble.sessionData.uuid }));
    });
    // load event listener
    window.addEventListener('load', function (event) {
        // load previous message
        textarea.value = Babble.sessionData.currentMessage;

        // disable login if already logged in
        if (Babble.sessionData.userInfo.email !== "") {
            document.getElementById("js-signupDialog").remove();
            Babble.register(Babble.sessionData.userInfo);
            initiateLongPolls();
        }
    });
}

Babble.textarea = document.getElementById("newMessage-contents");
// Data object to save all chat logs
// messages: new Array() , users: new Array(),userCount:0,
// Client code



//////addons
function autoResize(elem, minHeight, maxHeight) {
    elem.addEventListener("input", function (event) {
        if (minHeight > elem.scrollHeight) {
            elem.style.height = `${minHeight}px`;
            return;
        }
        elem.style.height = "auto";
        elem.style.height = `${elem.scrollHeight}px`;
        if (elem.scrollHeight >= maxHeight)
            elem.style.height = `${maxHeight}px`;
    });
}
