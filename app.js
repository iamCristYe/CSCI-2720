// use "C:\Program Files\MongoDB\Server\3.2\bin\mongod.exe" to start mongoDB
var db = require('./app_db.js'); // node initdb.js to initdb
var model = require('./app_model.js');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var sha256 = require('js-sha256').sha256;
var stringify = require('csv-stringify');
var app = express();

function handlerError(res, err) {
  console.log(err);
  res.json(err); // Return the error object for debugging purpose only.
}

app.use(session({secret: 'TopSecret', resave: true, saveUninitialized: false}));
app.use(bodyParser.urlencoded({extended: false}))

app.get([
  '/js/*', '/css/*', '/img/*', '/font/*'
], function (req, res) {
  res.sendFile(__dirname + '/static/' + req.path);
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/static/index.html');
})

app.get('/signin', function (req, res) {
  res.sendFile(__dirname + '/static/signin.html');
})

app.get('/signup', function (req, res) {
  res.sendFile(__dirname + '/static/signup.html');
})

app.get('/ajax/username', function (req, res) {
  res.send(req.session.username);
});

app.get('/ajax/MC', function (req, res) {

  var user = req.query.user;
  var uid = undefined;
  var tags = req.query.tags;
  var condition = {};

  //when user is given
  if (user) {
    model
      .User
      .find({
        username: user
      }, "_id", function (err, result) {
        if (err) 
          return handleError(res, err);
        if (result[0] == undefined) { //cannot find such user
          res.json([]); //send[]
          return;
        } else {
          uid = result[0]._id;
        }
        if (tags) {
          tags = tags.match(/[^\s,]+/g); // Use whitespace and comma as separators
        }
        if (tags != null && tags.length > 0) { //tags and uid
          condition = {
            tags: {
              $all: tags
            },
            uid: uid
          };
        }
        if ((tags == null || tags.length == 0)) { //uid only
          condition = {
            uid: uid
          };
        }
        model
          .MC
          .find(condition, "_id title desc A B C D ans tags uid time", function (err, MCs) {
            if (err) 
              return handleError(res, err);
            res.json(MCs);
          });
      })
  } else { //when no user option is given
    if (tags) {
      tags = tags.match(/[^\s,]+/g); // Use whitespace and comma as separators
    }

    if (tags != null && tags.length > 0) {
      condition = {
        tags: {
          $all: tags
        }
      };
    }

    model
      .MC
      .find(condition, "_id title desc A B C D ans tags uid time", function (err, MCs) {
        if (err) 
          return handleError(res, err);
        res.json(MCs);
      });
  }
})

app.post('/ajax/addMC', function (req, res) {
  if (req.session.username === undefined) {
    res.redirect('/signin?redirect=signInToContinue'); // Go to login page
    return;
  }

  model
    .User
    .find({
      username: req.session.username
    }, "_id", function (err, result) {
      if (err) 
        return handleError(res, err);
      
      var tags;
      if (req.body.tags) {
        tags = req
          .body
          .tags
          .match(/[^\s,]+/g);
        if (tags == null) 
          tags = [];
        }
      else 
        tags = [];
      
      var newMC = new model.MC({
        title: req.body.title,
        desc: req.body.desc,
        A: req.body.A,
        B: req.body.B,
        C: req.body.C,
        D: req.body.D,
        ans: req.body.ans,
        tags: tags,
        uid: result[0]._id,
        time: Date.now()
      })

      newMC.save(function (err, MC) {
        model
          .MC
          .find({
            _id: MC._id
          }, "_id title desc A B C D ans tags uid time", function (err, MC) {
            if (err) 
              return handleError(res, err);
            res.json(MC);
          });
      })

    });
})

app.post('/ajax/updateMC', function (req, res) {
  if (req.session.username === undefined) { //haven't signed in
    res.redirect('/signin?redirect=signInToContinue'); // Go to login page
    return;
  }

  model
    .MC
    .find({
      _id: req.body._id
    }, "uid", function (err, result) {
      if (err) 
        return handleError(res, err);
      if (result[0].uid != req.session.uid) { //not authorised
        res.send('not authorised');
        return;
      }

      var conditions = {
          _id: req.body._id
        },
        update = {
          $set: {
            title: req.body.title,
            desc: req.body.desc,
            A: req.body.A,
            B: req.body.B,
            C: req.body.C,
            D: req.body.D,
            ans: req.body.ans,
            tags: req.body.tags,
            time: Date.now()
          }
        };

      model
        .MC
        .update(conditions, update, function (err, result) {
          model
            .MC
            .find({
              _id: req.body._id
            }, "_id title desc A B C D ans tags uid time", function (err, MC) {
              if (err) 
                return handleError(res, err);
              res.json(MC);
            });
        });
    })
})

app.post('/ajax/deleteMC', function (req, res) {
  console.log(req.session.username, req.body._id);

  if (req.session.username === undefined) { //haven't signed in
    res.redirect('/signin?redirect=signInToContinue'); // Go to login page
    return;
  }

  model
    .MC
    .find({
      _id: req.body._id
    }, "uid", function (err, result) {
      if (err) 
        return handleError(res, err);
      if (result[0].uid != req.session.uid) { //not authorised
        res.send('not authorised');
        return;
      }
      model
        .MC
        .remove({
          _id: req.body._id
        }, function (err, result) {
          res.send('succeeded');
        });
    })
})

app.get('/ajax/people', function (req, res) {
  model
    .User
    .find({}, "_id username", function (err, users) {
      if (err) 
        return handleError(res, err);
      res.json(users);
    });
})

app.post('/auth/signin', function (req, res) {
  model
    .User
    .find({
      username: req.body.username
    }, "password _id", function (err, user) {
      if (err) 
        return handleError(res, err);
      if (user[0] == undefined) { //cannot find such user
        res.redirect('/signin?redirect=noSuchUser'); // Go to sign up page
        return;
      }
      if (sha256(req.body.password) == user[0].password) {
        req.session.username = req.body.username;
        req.session.uid = user[0]._id;
        res.redirect('/?redirect=signInSucceeded'); // Redirect the user to the "main page"
        return;
      } else {
        res.redirect('/signin?redirect=passwordWrong');
      }
    });
})

app.get('/auth/signout', function (req, res) {
  req
    .session
    .destroy();
  res.redirect('/?redirect=signOutSucceeded');
})

app.post('/auth/signup', function (req, res) {
  if (req.body.username.length > 12) {
    res.redirect('/signup?redirect=usernameTooLong'); // username too long
    return;
  }

  model
    .User
    .find({
      username: req.body.username
    }, "password", function (err, user) {
      if (err) 
        return handleError(res, err);
      if (user[0] != undefined) { //can find such username
        res.redirect('/signup?redirect=userAlreadyExist'); // username already exists
        return;
      }
      var newUser = new model.User({
        username: req.body.username,
        password: sha256(req.body.password)
      })
      newUser.save(function (err, MC) {
        req.session.username = req.body.username; //automatic login
        res.redirect('/?redirect=signUpSucceeded'); // Redirect the user to the "main page"
      })
    });
})

app.post('/service/csv', function (req, res) {
  var ids;
  if (req.body._id) {
    ids = req
      .body
      ._id
      .match(/[^\s,]+/g);
    if (ids == null) 
      ids = [];
    }
  else 
    ids = [];
  
  var resArray = [];
  if (ids != []) {
    model
      .MC
      .find({
        _id: {
          $any: ids
        }
      }, "title desc A B C D ans tags uid time", function (err, result) {
        for (var index = 0; index < result.length; index++) {
          model
            .User
            .find({
              _id: uid
            }, 'username', function (err, username) {
              resArray.push([
                result[index].title,
                result[index].desc,
                result[index].A,
                result[index].B,
                result[index].C,
                result[index].D,
                result[index].ans,
                result[index].tags,
                username[0].username,
                result[index].time
              ]);

            })
        }
      })
  } else {
    res.send([]);
    return;
  }

  stringify(input, function (err, output) {
    res.setHeader('Content-disposition', 'attachment; filename=MC.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(resArray);
  });

})

app.listen(process.env.PORT || 80);
