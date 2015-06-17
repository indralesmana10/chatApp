angular.module('mychat.controllers', [])

.controller('LoginCtrl', function($scope, $ionicModal, $state, $firebaseAuth, $ionicLoading, $rootScope) {
    //console.log('Login Controller Initialized');
    var firebaseUrl = "https://colorblindchat.firebaseio.com/";
    var ref = new Firebase(firebaseUrl);
    var auth = $firebaseAuth(ref);  

    $ionicModal.fromTemplateUrl('templates/signup.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });

    $scope.createUser = function (user) {
        console.log("Create User Function called");
        if (user && user.email && user.password && user.displayname) {
            $ionicLoading.show({
                template: 'Signing Up...'
            });

            auth.$createUser({
                email: user.email,
                password: user.password
            }).then(function (userData) {
                alert("User created successfully!");
                ref.child("users").child(userData.uid).child('user_info').set({
                    email: user.email,
                    displayName: user.displayname
                });
                $ionicLoading.hide();
                $scope.modal.hide();
            }).catch(function (error) {
                alert("Error: " + error);
                $ionicLoading.hide();
            });
        } else
            alert("Please fill all details");
    }

    $scope.signIn = function (user) {

        if (user && user.email && user.pwdForLogin) {
            $ionicLoading.show({
                template: 'Signing In...'
            });
            auth.$authWithPassword({
                email: user.email,
                password: user.pwdForLogin
            }).then(function (authData) {
                console.log("Logged in as:" + user.email);
                ref.child("users").child(authData.uid).child('user_info').once('value', function (snapshot) {
                    var val = snapshot.val();
                    console.log(val);
                    // To Update AngularJS $scope either use $apply or $timeout
                    $scope.$apply(function () {
                        $rootScope.displayName = val;
                    });
                });
                $ionicLoading.hide();
                $state.go('tab.rooms');
            }).catch(function (error) {
                alert("Authentication failed:" + error.message);
                $ionicLoading.hide();
            });
        } else
            alert("Please enter email and password both");
    }
})


.controller('ChatCtrl', function ($scope, Chats, $state) {
    var firebaseUrl = "https://colorblindchat.firebaseio.com/";
    var ref = new Firebase(firebaseUrl);
    var authData = ref.getAuth();

    $scope.chats = Chats.all();

    $scope.uEmail = authData.password.email;
    $scope.paramEmailContact = $state.params.roomId;
    

    //console.log($scope.chats);
    $scope.IM = {
        textMessage: ""
    };

    Chats.selectRoom($state.params.roomId);
    console.log($state.params.roomId);

    var roomName = Chats.getSelectedRoomName();

    // Fetching Chat Records only if a Room is Selected
    if (roomName) {
        $scope.roomName = " - " + roomName;
        $scope.chats = Chats.all();
    }


    $scope.sendMessage = function (msg) {
        console.log(msg);
        Chats.send($scope.displayName, $state.params.roomId, authData.password.email, msg);
        $scope.IM.textMessage = "";
    }

    $scope.remove = function (chat) {
        Chats.remove(chat);
    }

})

.controller('RoomsCtrl', function ($scope, $ionicModal, $ionicLoading, $firebaseAuth, $firebase, Rooms, Chats, Contacts, $state) {
    //console.log("Rooms Controller initialized");
    var firebaseUrl = "https://colorblindchat.firebaseio.com/";
    var ref = new Firebase(firebaseUrl);
    //var auth = $firebaseAuth(ref); 
    var authData = ref.getAuth();

    $ionicModal.fromTemplateUrl('templates/addContact.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });


    $scope.rooms = Rooms.all();

    $scope.contacts = Contacts.all();

    $scope.openChatRoom = function (emailContact) {
        var firebaseUrl2 = "https://colorblindchat.firebaseio.com/rooms";
        var ref2 = new Firebase(firebaseUrl2);
        ref2.once('value', function(datas) {
            var len = datas.numChildren();
            if (len > 0) {
                var s, room;
                datas.forEach(function(data) {
                    var users = data.child('users').val();
                    room = data.child('name').val();
                    // check if room exists
                    
                    if (((users.a == authData.password.email) && (users.b == emailContact)) || ((users.b == authData.password.email) && (users.a == emailContact))) {
                         s = true;
                    } else {
                        s = false;
                    }

                    return s;
                })

                if (s == true) {
                    // create random name for room
                        function makeid() {
                            var text = "";
                            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                            for( var i=0; i < 10; i++ )
                                text += possible.charAt(Math.floor(Math.random() * possible.length));

                            return text;
                        }
                        var rand = makeid();

                        // directing
                        $state.go('tab.chat', {
                            roomId: rand
                        });

                        var rooms = $firebase(ref.child('rooms')).$asArray();

                        var roomsMessage = {
                            name : rand,
                            users : {
                                a : authData.password.email,
                                b : emailContact
                            }
                        };

                        rooms.$add(roomsMessage).then(function () {
                             console.log('Create new room: '+rand+' while length: ' + len);
                        });
                } else {
                        console.log('Existing room used > ' + room);
                    // directing
                        $state.go('tab.chat', {
                            roomId: room
                        });
                }
            } else {
                // create random name for room
                        function makeid() {
                            var text = "";
                            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                            for( var i=0; i < 10; i++ )
                                text += possible.charAt(Math.floor(Math.random() * possible.length));

                            return text;
                        }
                        var rand = makeid();

                        // directing
                        $state.go('tab.chat', {
                            roomId: rand
                        });

                        var rooms = $firebase(ref.child('rooms')).$asArray();

                        var roomsMessage = {
                            name : rand,
                            users : {
                                a : authData.password.email,
                                b : emailContact
                            }
                        };

                        rooms.$add(roomsMessage).then(function () {
                             console.log('Create new room: '+rand);
                        });
            }
        })
    }

    // Adding contact
    $scope.addContact = function (contact) {

        

        /*var refRoom = new Firebase("https://colorblindchat.firebaseio.com/rooms");

        refRoom.orderByKey().on("child_added", function(snapshot) {
          console.log('aaaaaa' + snapshot.key());
        });
*/
        checkIfUserExists(contact.email);

        /*var syncAuthData = $firebaseAuth(ref);
        
        console.log(syncAuthData);*/
        var firebaseUrl = "https://colorblindchat.firebaseio.com/users";
        var usersListRef = new Firebase(firebaseUrl);

        
        

        function userExistsCallback(userId, exists, sameCurrentUserEmail) {

            if (exists && contact && contact.email) {

                
                ref.child("users").child(authData.uid).child("contacts").push({
                    email: contact.email,
                    date: Firebase.ServerValue.TIMESTAMP
                });

                

               /* usersListRef.once('value', function(allUsersSnapshot) {
         
                    allUsersSnapshot.forEach(function(userSnapshot) {
                        var usersEmail = userSnapshot.child('user_info').child('email').val();
             
                        if (usersEmail == contact.email) {
                            ref.child("users").child(userSnapshot.key()).child("contacts").push({
                                email: authData.password.email,
                                date: Firebase.ServerValue.TIMESTAMP
                            });
                        };
                    });

                });*/

                

                $ionicLoading.show({
                    template: 'Adding New Contact...',
                    duration: 1000
                });

                $scope.modal.hide();

            } else if (sameCurrentUserEmail){
                $ionicLoading.show({
                    template: 'Can not add your email self',
                    duration: 1000
                });
            } else {

                $ionicLoading.show({
                    template: 'Contact not exists',
                    duration: 1000
                });

            }

        }
         

        function checkIfUserExists(userId) {

            //console.log(userId);
            
            var firebaseUrl = "https://colorblindchat.firebaseio.com/users";
            var usersListRef = new Firebase(firebaseUrl);

            usersListRef.once('value', function(allUsersSnapshot) {
                // allUsersSnapshot.val() >> all users

                /// get current user email ///
                var currentUserEmail = allUsersSnapshot.child(authData.uid).child('user_info').child('email').val();

                /// get current contacts on current user email
                var firebaseUrlContacts = "https://colorblindchat.firebaseio.com/users/" + authData.uid + "/contacts";
                var contactsListRef = new Firebase(firebaseUrlContacts);

                var getNewContacts;
                contactsListRef.on("child_added", function(snapshot) {
                    var newContacts = snapshot.val();
                    getNewContacts = newContacts.email; // Iterating contacts


                });

                /// To check that user is exist //// 
                allUsersSnapshot.forEach(function(userSnapshot) {
                    var usersEmail = userSnapshot.child('user_info').child('email').val();
                    var exists = (usersEmail === userId && currentUserEmail !== userId);

                    //console.log('My Contact > ' + usersEmail, 'My Email > ' + currentUserEmail, 'Filled email > ' + userId);

                    var sameCurrentUserEmail = (currentUserEmail === userId);
                    userExistsCallback(userId, exists, sameCurrentUserEmail);
                });

            });
        }


        
         
        


    }


});




