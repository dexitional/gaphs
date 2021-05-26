var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Chat', Schema({
  _id: { type: Schema.Types.ObjectId, auto:true },
  room: { type: String, default :''},
  username: String,
  message: String,
  time: Date,
  status: { type: Number, default: 1}
}));
