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
            action: '/messages?counter=' + Babble.counter,
            request_id: Babble.sessionData.uid,
            data: ''
        }).then(function(data) {
            callback(JSON.parse(data));
          });
    },
    postMessage: function (message, callback) {//message:Object, callback:Function
        Babble.request({
            method: 'POST',
            action: '/messages',
            request_id: Babble.sessionData.uid,
            data: JSON.stringify(message)//"{name:String, email:String, message:String, timestamp:Number(ms)}"
        }).then(function(data) {
            callback(JSON.parse(data));
          });
    },
    deleteMessage: function (id, callback) {//id:String, callback:Function
        Babble.request({
            method: 'DELETE',
            action: '/messages/' + id,
            request_id: Babble.sessionData.uid,
            data: ''
        }).then(function(data) {
            callback(JSON.parse(data));
          });
    },
    getStats: function (callback) {//Function
        Babble.request({
            method: 'GET',
            action: '/stats',
            request_id: Babble.sessionData.uid,
            data: ''
        }).then(function(data) {
            callback(JSON.parse(data));
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

       // generate UID if you have none.
       if (Babble.sessionData.uid === "" && !window.sinon) {
        Babble.sessionData.uid=Babble.sessionData.userInfo.email||"ann@segev.tk";
       }
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
        console.log("all");
        console.log(data);
        if(data!=undefined&&data!="")
        {
            console.log("good");
            if (data.delete)
                Babble.chatWindow.removeChild(document.getElementById("msg-" + data.id));
            else 
            {
                // update internal counter
                Babble.counter += data.length;
                // visuallly display on the DOM
                data.forEach(function (message) {
                    addMessageDOM(message);//todo
                });
            }
        }
        // call the next long poll
        Babble.polling();
    });
}

function addMessageDOM(message) {
    // dirty hack to create the element
    let date = new Date(message.timestamp * 1);
    // handle button code
    if (message.name !== "" && message.email !== "") {

    } else {
        message.name = "Anonymous";
        message.imageUrl = "./images/anon.png";
    }
    
    let buttoncode = "";
    if (message.email ===Babble.sessionData.userInfo.email) {
        buttoncode = "\n<button class=\"Message-deleteBtn js-deleteMsgBtn\" aria-label=\"Delete Message #" + message.id + "\">X</button>";
    }

           
    let tempDiv=document.createElement("div");
    tempDiv.innerHTML = `<li class="Message" id="msg-${message.id}">
                        <img src="${message.imageUrl}" alt="" class="Message-image" />
                        <section class="Message-inner" tabindex="0">
                            <header class="Message-innerHead FlexGridRow">
                                <cite class="Message-author">${message.name}</cite>
                                <time class="Message-time" datetime="${date.toISOString()}">${timeToTimestamp(date)}</time>${buttoncode}
                            </header>
                            <div class="Message-inner-contents">
                                ${message.message.replace("\n", "<br>")}
                            </div>
                        </section>
                    </li>`;
 
    // delete button
    let messageDelBtn = tempDiv.firstElementChild.getElementsByClassName("js-deleteMsgBtn")[0];
    if (messageDelBtn) {
        messageDelBtn.addEventListener("click", function () {
            Babble.deleteMessage(message.id, function () { });
        });
    }

    // append to chat window
    Babble.chatWindow.appendChild(tempDiv.firstElementChild);
    //Babble.chatContainer.scrollTop = Babble.chatWindow.scrollHeight;
}


Babble.polling2= function(){
        Babble.getStats(function (data) {
            Babble.statsMessages.innerHTML = data.messages;
            Babble.statsPeople.innerHTML = data.users;
           Babble.polling2();
        });
}

// Babble.sendMessage= 

Babble.onloadP=function(){

    // signup dialog
    let loginBtn = document.getElementById("js-loginBtn");
    let anonBtn = document.getElementById("js-stayAnonBtn");
    let ChatSubmitForm = document.getElementById("js-ChatSubmit-form");
    Babble.chatWindow = document.getElementById("js-chatWindow");
    let textarea = document.getElementById("js-newMessage-area");
    let signupDialog = document.getElementById("js-signupDialog");

    Babble.statsMessages=document.getElementById("js-stats-messages");
    Babble.statsPeople=document.getElementById("js-stats-people");


    loginBtn.addEventListener("click", function (e) {
        e.preventDefault();
        Babble.register({
            name: document.getElementById("signup-fullname").value,
            email: document.getElementById("signup-email").value
        });
        Babble.polling2();
        Babble.polling();
        signupDialog.classList.add("u-hidden");
    });

    anonBtn.addEventListener("click", function (e) {
        e.preventDefault();
        window.Babble.register({
            name: "",
            email: ""
        });
        Babble.polling2();
        Babble.polling();
        signupDialog.classList.add("u-hidden");
    });

   

    
    ChatSubmitForm.addEventListener("submit",function(event) {
        console.log(event);
        event.preventDefault(); // prevent refresh
   
       if (textarea.value == "") {
           alert("You can't have an empty message");
           return;
       }
   
       let message ={
           name: Babble.sessionData.userInfo.name,
           email: Babble.sessionData.userInfo.email,
           message: textarea.value,
           timestamp: Date.now().toString(),
           id: 0
       };
       Babble.postMessage(message, function (data) {
           textarea.value = "";
           textarea.style.height = "auto";
       });
   });
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
            signupDialog.remove();
            Babble.register(Babble.sessionData.userInfo);
            Babble.polling2();
            Babble.polling();
        }
    });
};
Babble.onloadP();



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

function timeToTimestamp(date) {
    let hours = ("0" + date.getHours()).slice(-2);
    let minutes = ("0" + date.getMinutes()).slice(-2);
    return hours + ":" + minutes;
}
