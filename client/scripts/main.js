
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
            data: ''
        }).then(callback(returned_data));

        //     http.getJSON('/messages?counter='+counter, function(response) {
        //     counter = response.count;
        //     //var elem = $('#output');
        //     //elem.text(elem.text() + response.append);
        //     Babble.getMessages(counter,callback);
        // });
    },
    postMessage: function (message, callback) {//message:Object, callback:Function
        Babble.request({
            method: 'POST',
            action: '/messages?counter=' + counter,
            data: message//"{name:String, email:String, message:String, timestamp:Number(ms)}"
        }).then(callback(returned_data));
    },
    deleteMessage: function (id, callback) {//id:String, callback:Function
        Babble.request({
            method: 'DELETE',
            action: '/messages/:' + id,
            data: ''
        }).then(callback(returned_data));
    },
    getStats: function (callback) {//Function
        Babble.request({
            method: 'GET',
            action: '/stats',
            request_id: session.uuid,
            data: ''
        }).then(callback(returned_data));
    }
    , request: function (options) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open(options.method, options.action);
            if (options.method === 'post') {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }
            if (options.request_id) {
                xhr.setRequestHeader("X-Request-Id", options.request_id);
            }
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
     sessionData = lastSession;

    // if noting is in the local storage
if (localStorage.getItem("babble") === null) {
    localStorage.setItem('babble', JSON.stringify(sessionData));
}
Babble.register=function (userInfo) {
    ajax({
        method: "POST",
        action: `${host}/login`,
        data: JSON.stringify({ uuid: session.uuid })
    });
    sessionData.userInfo.name = userInfo.name;
    sessionData.userInfo.email = userInfo.email;
    localStorage.setItem('babble', JSON.stringify(sessionData));
};
Babble.polling= function(){
    Babble.getMessages(counter, function (data) {
        if (data.delete)
            deleteMessageDOM(data.id);
        else 
        {
            // update internal counter
            counter += data.length;
            // visuallly display on the DOM
            data.forEach(function (message) {
                addMessageDOM(message);
            });
        }
        // call the next long poll
        Babble.polling();
    });
}
Babble.polling();
// Data object to save all chat logs
// messages: new Array() , users: new Array(),userCount:0,
// Client code
