var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Member', Schema({
  _id: Schema.Types.ObjectId,
  prog_id: {
     required: true,
     type: Schema.Types.ObjectId, 
     ref: 'Program'
  },
  indexno: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  level: Number,
  fname: String,
  lname: String,
  dob: Date,
  phone: String,
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  photo: String,
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: String,
  photo: {type: String, default: null},
  level: Number,
  last_login: Date,
  isAdmin: {type: Boolean, default: false},
  registered: { type: Number, default: 1},
  status: { type: Number, default: 1},
}));
