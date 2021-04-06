var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Program', Schema({
  _id: Schema.Types.ObjectId,
  title: String,
  status: { type: Number, default: 1}
}));
