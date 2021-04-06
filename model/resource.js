var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Resource', Schema({
  _id: Schema.Types.ObjectId,
  prog_id: {
     required: true,
     type: Schema.Types.ObjectId, 
     ref: 'Program'
  },
  title: String,
  path: String,
  level: Number,
  status: { type: Number, default: 1}
}));
