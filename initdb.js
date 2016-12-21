// This file contains code to repopulate the DB with test data

var mongoose = require('mongoose');

require('./app_db.js'); // Set up connection and create DB if it does not exists yet

var model = require('./app_model.js');

// Remove existing data from Users and MCs collections and repopulate them
// with test data
model
  .User
  .remove({}, function (err) {
    if (err) 
      return console.log(err);
    
    model
      .MC
      .remove({}, function (err) {
        if (err) 
          return console.log(err);
        
        populateData();
      });
  });

// ----------------------------------------------------------------------

function populateData() {
  var t = ['CUHK', 'CC', 'NA', 'UC'];

  var MCs = [
    _MC('How many colleges are there in CUHK?', 'How many?', '6', '7', '8', '9', 'D', [
      t[0], t[1], t[2], t[3]
    ], 0, new Date(2016, 11, 10)),
    _MC('When was CC founded?', 'When?', '1950', '1951', '1952', '1953', 'B', [
      t[0], t[1]
    ], 1, new Date(2016, 11, 10)),
    _MC('When was NA founded?', 'When?', '1947', '1948', '1949', '1950', 'C', [
      t[0], t[2]
    ], 2, new Date(2016, 11, 10)),
    _MC('When was UC founded?', 'When?', '1956', '1957', '1958', '1959', 'A', [
      t[0], t[3]
    ], 1, new Date(2016, 11, 10)),
    _MC('How many hostels does CC have?', 'How many?', '7', '8', '9', '10', 'D', [
      t[0], t[1]
    ], 2, new Date(2016, 11, 10)),
    _MC('How many hostels does NA have?', 'How many?', '3', '4', '5', '6', 'B', [
      t[0], t[2]
    ], 0, new Date(2016, 11, 10)),
    _MC('How many hostels does UC have?', 'How many?', '4', '5', '6', '7', 'A', [
      t[0], t[3]
    ], 0, new Date(2016, 11, 10))
  ];

  // 3 users Password is the hashed name
  var users = [
    _user('john', '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a'),
    _user('jane', '81f8f6dde88365f3928796ec7aa53f72820b06db8664f5fe76a7eb13e24546a2'),
    _user('eric', '6f9edcd3408cbda14a837e6a44fc5b7f64ccc9a2477c1498fcb13c777ffb9605')
  ];

  // Insert all users at once
  model
    .User
    .create(users, function (err, _users) {
      if (err) 
        handleError(err);
      
      // _users are now saved to DB and have _id 
      // Replace the owner indexes by their _ids
      for (var i = 0; i < MCs.length; i++) {
        var uidindex = MCs[i].uid;
        MCs[i].uid = _users[uidindex]._id;
      }

      // Insert all MCs
      model
        .MC
        .create(MCs, function (err, _MCs) {
          if (err) 
            handleError(err);
          
          // Success
          console.log(_users);
          console.log(_MCs);
          mongoose
            .connection
            .close();
        });
    });
}

function _user(username, password) {
  return {username: username, password: password};
}

function _MC(title, desc, A, B, C, D, ans, tags, uid, time) {
  return {
    title: title,
    desc: desc,
    A: A,
    B: B,
    C: C,
    D: D,
    ans: ans,
    tags: tags,
    uid: uid,
    time: time
  };
}

function handleError(err) {
  console.log(err);
  mongoose
    .connection
    .close();
}
