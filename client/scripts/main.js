
var Babble = {
    counter: 0,
    session: {
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
            xhr.addEventListener('load', e => {
                resolve(e.target.responseText);
            });
            xhr.send(options.data);
        });
    }

}; // Data object to save all chat logs
// messages: new Array() , users: new Array(),userCount:0,
// Client code
