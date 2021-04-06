var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Executive', Schema({
  _id: Schema.Types.ObjectId,
  prog_id: {
     required: true,
     type: Schema.Types.ObjectId, 
     ref: 'Program'
  },
  name: String,
  position: String,
  path: String,
  active: { type: Number, default: 1}
}));
