var mongoose = require('mongoose');
var CarProperty = require('./CarProperty');
var findOrCreate = require('mongoose-findorcreate')

var CarSchema = new mongoose.Schema({
  id: Number,
  url: String,
  model: {
    name: String,
    version: String
  },
  maker: String,
  imageSrc: String,
  properties: [{
    property: { type: mongoose.Schema.ObjectId, ref: 'CarProperty' },
    value: String
  }],
}, { skipVersioning: { properties: true } });

CarSchema.plugin(findOrCreate);

module.exports = mongoose.model('Car', CarSchema);