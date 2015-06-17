var app = angular.module('mychat.services', ['firebase']);

app.factory("Auth", ["$firebaseAuth", "$rootScope",
    function ($firebaseAuth, $rootScope) {
            var ref = new Firebase(firebaseUrl);
            return $firebaseAuth(ref);
}])

app.factory("currentUser", function ($firebase, Auth) {

});

app.factory('Chats', function ($firebase, Rooms, Contacts) {

    var selectedRoomId;

    var ref = new Firebase(firebaseUrl);
    var chats = $firebase(ref.child('rooms').child('chats')).$asArray();

    return {
        all: function () {
            return chats;
        },
        remove: function (chat) {
            chats.$remove(chat).then(function (ref) {
                ref.key() === chat.$id; // true item has been removed
            });
        },
        get: function (chatId) {
            for (var i = 0; i < chats.length; i++) {
                if (chats[i].id === parseInt(chatId)) {
                    return chats[i];
                }
            }
            return null;
        },
        getSelectedRoomName: function () {
            var selectedRoom;
            if (selectedRoomId && selectedRoomId != null) {
                selectedRoom = Rooms.get(selectedRoomId);
                if (selectedRoom)
                    return selectedRoom.name;
                else
                    return null;
            } else
                return null;
        },
        selectRoom: function (roomId) {
            selectedRoomId = roomId;
            if (!isNaN(roomId)) {
                chats = $firebase(ref.child('rooms').child(selectedRoomId).child('chats')).$asArray();
            }
        },
        send: function (from, paramId, paramUEmail, message) {
            console.log("sending message from :" + from.displayName + " & message is " + message + " &  chat with : " + paramId + " & Uid : " + paramUEmail);
            if (from && message) {
                var chatMessage = {
                    from: from.displayName,
                    message: message,
                    createdAt: Firebase.ServerValue.TIMESTAMP,
                    users : {
                        email: paramUEmail,
                        email: paramId,
                    }
                };
                chats.$add(chatMessage).then(function (data) {
                    console.log("message added");
                });
            }
        }
    }
})

/**
 * Simple Service which returns Rooms collection as Array from Salesforce & binds to the Scope in Controller
 */
app.factory('Rooms', function ($firebase) {
    // Might use a resource here that returns a JSON array
    var ref = new Firebase(firebaseUrl);

    var rooms = $firebase(ref.child('rooms')).$asArray();

    return {
        all: function () {
            return rooms;
        },
        get: function (roomId) {
            // Simple index lookup
            return rooms.$getRecord(roomId);
        }
    }
});


app.factory('Contacts', function ($firebase) {
    
    var ref = new Firebase(firebaseUrl);

    var authData = ref.getAuth();

    var contacts = $firebase(ref.child('users').child(authData.uid).child('contacts')).$asArray();

    return {
        all: function() {
          return contacts;
        }
    }

});

