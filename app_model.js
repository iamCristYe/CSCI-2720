var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var UserSchema = Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }  //sha256 hashed
});

var MCSchema = Schema({
  title: { type: String, default: '' },
  desc: { type: String, default: '' },
  A: { type: String, default: '' },
  B: { type: String, default: '' },
  C: { type: String, default: '' },
  D: { type: String, default: '' },
  ans: { type: String, default: '' },
  tags: [ { type: String } ],
  uid: { type: ObjectId, ref: 'User' },
  time: { type: Date, default: Date.now }  
});


var User = mongoose.model('User', UserSchema);
var MC = mongoose.model('MC', MCSchema);

module.exports = {
  User: User,
  MC: MC
}
