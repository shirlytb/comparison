require('dotenv').load();
const args = process.argv
  .map(val => val.split('=')) // split by the = character
  .filter(val => val.length > 1) // remove args with no = character
  .reduce((accumulator, target) => ({ ...accumulator, [target[0]]: target[1] }), {}); // transform to hash

var mongoose = require('mongoose');
mongoose.connect(process.env.DB_URL);

var Car = require('./models/Car');
var CarProperty = require('./models/CarProperty');

const rp = require('request-promise');
const cheerio = require('cheerio');
const options = {
  uri: process.env.CAR_PAGE,
  transform: function (body) {
    return cheerio.load(body);
  }
};

const extractText = function ($element) {
  return $element.text().trim();
}

function extractCarData($) {
  Car.findOrCreate({ id: 7495 }).then((result) => {
    car = result.doc;

    // Get model info
    $crumbs = $('p[class=breadcrumbs]').find('a:nth-child(n+2)').toArray();
    car.model.version = extractText($($crumbs.pop()));
    car.model.name = extractText($($crumbs.pop()));
    car.maker = extractText($($crumbs.pop()));

    // Get model image
    car.imageSrc = $('div[class=model-image]').children('img').prop('src');

    promises = [];
    // Get all props
    $('table[class=articleAccordian-FixFontColorToWhite]')
      .find('td[class=propValue]')
      .each(function (i, el) {
        promise = new Promise((resolve, reject) => {
          $this = $(this);
          $propName = $this.prev('td');
          CarProperty
            .findOrCreate({ id: $this.data('propid') }, { name: extractText($propName) })
            .then(result => {
              prop = result.doc;
              resolve({ property: prop._id, value: extractText($(this)) });
            });
        });
        promises.push(promise);
      });

    Promise.all(promises).then(
      (properties) => {
        car.properties = properties;
        car.save((err, car) => {
          if (err) return console.error(err);
        });
      }, (error) => {
        console.error(error);
      })
  });
}

// rp(options)
//   .then(extractCarData)
//   .catch((err) => {
//     console.log(err);
//   });

Car.findOne({ id: 7495 }).populate({ path: 'properties.property' }).then((result) => {
  require('console.table');
  console.table(result.properties.toObject().map((prop) => { return { name: prop.property.name, value: prop.value } }));
});