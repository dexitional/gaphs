var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Article', Schema({
  _id: Schema.Types.ObjectId,
  title: String,
  content: String,
  image: String,
  author: String,
  status: { type: Number, default: 1},
  created_at: {type: Date, default: Date.now()}
}));
