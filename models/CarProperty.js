var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate')

var CarPropertySchema = new mongoose.Schema({
  id: Number,
  name: String,
});

CarPropertySchema.plugin(findOrCreate);

module.exports = mongoose.model('CarProperty', CarPropertySchema);