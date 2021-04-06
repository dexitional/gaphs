var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Due', Schema({
  _id: Schema.Types.ObjectId,
  indexno: String,
  title: String,
  level: Number,
  transact_date: Date,
  amount: Number,
}));
