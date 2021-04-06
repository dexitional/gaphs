var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Event', Schema({
  _id: Schema.Types.ObjectId,
  title: String,
  description: String,
  venue: String,
  date: Date,
  time: String,
  author: String,
  occurred: { type: Number, default: 0},
}));
