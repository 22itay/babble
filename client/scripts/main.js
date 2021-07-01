'use strict';
window.Babble = {
    counter: 0,
    host: "http://localhost:9000",
    sessionData: {
        currentMessage: "",
        userInfo: {
            name: "",
            email: ""
        },
    },
    register: function (userInfo) {//userInfo:Object
        Babble.sessionData.userInfo.name = userInfo.name;
        Babble.sessionData.userInfo.email = userInfo.email;
        localStorage.setItem('babble', JSON.stringify(Babble.sessionData));
        Babble.request({
            method: 'POST',
            action: '/login',
            request_id: userInfo.email,
            data: ''
            //data: JSON.stringify({ email:userInfo.email })
        });
    },
    getMessages: function (counter, callback) {//counter:Number, callback:Function
        Babble.request({
            method: 'GET',
            action: '/messages?counter=' + Babble.counter,
            timeout: 2 * 60 * 1000,
            data: ''
        }, callback);
    },
    postMessage: function (message, callback) {//message:Object, callback:Function
        Babble.request({
            method: 'POST',
            action: '/messages',
            data: JSON.stringify(message)//"{name:String, email:String, message:String, timestamp:Number(ms)}"
        }, callback);
    },
    deleteMessage: function (id, callback) {//id:String, callback:Function
        Babble.request({
            method: 'DELETE',
            action: '/messages/' + id,
            request_id: Babble.sessionData.userInfo.email,
            data: ''
        }, callback);
    },
    getStats: function (callback) {//Function
        Babble.request({
            method: 'GET',
            action: '/stats',
            timeout: 2 * 60 * 1000,
            data: ''
        }, callback);
    }
    , request: function (options, callback) {
        var xhr = new XMLHttpRequest();

        xhr.open(options.method, Babble.host + options.action);

        if (options.method === 'post') {
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        if (options.request_id) {
            xhr.setRequestHeader("X-Request-Id", options.request_id);
        }
        if (options.timeout) {
            console.log(options.timeout);
            xhr.timeout = options.timeout;
        }
        xhr.withCredentials = false;
        xhr.onload = function (e) {
            //resolve(e.target.responseText);
            if (e.target.status != 200 && e.target.status != 202) {
                console.log("request returnd white error  " + e.target.status);
            } else {
                if (callback) {
                    if (e.target.responseText != '')
                        callback(JSON.parse(e.target.responseText));
                    else
                        callback();
                }
            }
        }
        xhr.ontimeout = function (e) {
            console.log("ontimeout");
            if (callback) {
                callback({ timeout: true });
            }
        };
        xhr.send(options.data);
    }

};

Babble.polling = function () {
    Babble.getMessages(Babble.counter, function (data) {
        console.log(data.timeout)
        if (data != undefined && data != "" && data.timeout == undefined) {
            if (data.delete)
                Babble.chatWindow.removeChild(document.getElementById("msg-" + data.msid));
            else {
                // update counter
                Babble.counter += data.length;
                //  display the message to client
                data.forEach(function (message) {
                    if (message.name == " " && message.email == " ") {
                        message.name = "Anonymous";
                        message.imageUrl = "./images/anon.png";
                    }

                    let deletebutton = "";
                    if (message.email === Babble.sessionData.userInfo.email) {
                        deletebutton = "\n<button class='Message-delBtn js-delMsgBtn' aria-label='Delete Message #" + message.id + "'>X</button>";
                    }

                    console.log(message.message);
                    let date = new Date(message.timestamp * 1);
                    let tempDiv = document.createElement("div");
                    tempDiv.innerHTML = `<li class="Message" id="msg-${message.id}">
                                        <img src="${message.imageUrl}" alt="" class="Message-image" />
                                        <section class="Message-inner" tabindex="0">
                                            <header class="Message-inner-top FlexGridRow">
                                                <cite class="Message-author">${message.name}</cite>
                                                <time class="Message-time" datetime="${date.toISOString()}">${timeToTimestamp(date)}</time>${deletebutton}
                                            </header>
                                            <div class="Message-contents">
                                                ${message.message}
                                            </div>
                                        </section>
                                    </li>`;
                    // delete button onclick
                    let messageDelBtn = tempDiv.firstElementChild.getElementsByClassName("js-delMsgBtn")[0];
                    if (messageDelBtn) {
                        messageDelBtn.addEventListener("click", function () {
                            Babble.deleteMessage(message.id, function () { });
                        });
                    }

                    // add message
                    Babble.chatWindow.appendChild(tempDiv.firstElementChild);
                    Babble.chatWindow.scrollTop = Babble.chatWindow.scrollHeight;
                });
            }
        }
        // call the next long poll
        Babble.polling();
    });
}

Babble.polling2 = function () {
    Babble.getStats(function (data) {
        if (data.timeout == undefined) {
            Babble.statsMessages.innerHTML = data.messages;
            Babble.statsPeople.innerHTML = data.users;
        }
        Babble.polling2();
    });
}

Babble.onloadP = function () {
    // localStorage
    let lastSession = JSON.parse(localStorage.getItem("babble"));
    if (lastSession)
        Babble.sessionData = lastSession;
    else
        localStorage.setItem('babble', JSON.stringify(Babble.sessionData));

    // DoM Elements
    Babble.chatWindow = document.getElementById("js-chatWindow");
    Babble.statsMessages = document.getElementById("js-stats-messages");
    Babble.statsPeople = document.getElementById("js-stats-people");
    let loginBtn = document.getElementById("js-loginBtn");
    let anonBtn = document.getElementById("js-AnonBtn");
    let ChatSubmitForm = document.getElementById("js-ChatSubmit-form");
    let textarea = document.getElementById("js-newMessage-area");
    let SignupModal = document.getElementById("js-SignupModal");


    if (textarea) {
        autoResize(textarea, 100, 300);
        // unload event listener
        window.addEventListener('beforeunload', function (event) {
            Babble.sessionData.currentMessage = textarea.value;
            localStorage.setItem('babble', JSON.stringify(Babble.sessionData));
            navigator.sendBeacon(Babble.host + "/logout", JSON.stringify({ email: Babble.sessionData.userInfo.email }));
        });
        // load event listener
        window.addEventListener('load', function (event) {
            // load previous message
            textarea.value = Babble.sessionData.currentMessage;

            // disable login if already logged in
            if (Babble.sessionData.userInfo.email !== "") {
                SignupModal.remove();
                Babble.polling2();
                Babble.register(Babble.sessionData.userInfo);
                Babble.polling();
            }
        });
    }

    if (ChatSubmitForm) {
        ChatSubmitForm.addEventListener("submit", function (e) {
            e.preventDefault();

            if (textarea.value == "") {
                alert("You can't send an empty message");
                return;
            }

            let message = {
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
    }


    if (anonBtn) {
        anonBtn.addEventListener("click", function (e) {
            e.preventDefault();
            Babble.polling2();
            Babble.register({
                name: " ",
                email: " "
            });
            Babble.polling();
            SignupModal.classList.add("u-hidden");
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener("click", function (e) {
            e.preventDefault();
            Babble.polling2();
            Babble.register({
                name: document.getElementById("signup-name").value,
                email: document.getElementById("signup-email").value
            });
            Babble.polling();
            SignupModal.classList.add("u-hidden");
        });
    }

};
Babble.onloadP();



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
//https://www.sitepoint.com/beginners-guide-to-javascript-date-and-time/
function timeToTimestamp(date) {
    let hours = ("0" + date.getHours()).slice(-2);
    let minutes = ("0" + date.getMinutes()).slice(-2);
    return hours + ":" + minutes;
}
