var mongoose = require('mongoose');
var CarProperty = require('./CarProperty');
var findOrCreate = require('mongoose-findorcreate')

var CarSchema = new mongoose.Schema({
  id: Number,
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
});

CarSchema.plugin(findOrCreate);

module.exports = mongoose.model('Car', CarSchema);