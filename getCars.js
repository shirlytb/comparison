require('dotenv').load();
var Promise = require("bluebird");
var mongoose = require('mongoose');
mongoose.connect(process.env.DB_URL);
const rp = require('request-promise');
const cheerio = require('cheerio');
const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const Car = require('./models/Car');
const CarProperty = require('./models/CarProperty');

const transformToCheerio = (body) => cheerio.load(body);

const extractText = ($element) => $element.text().trim();

cars = [];
winston.log('verbose', 'Requesting cars archive page');
rp({ uri: process.env.CARS_ARCHIVE, transform: transformToCheerio })
  .then(($) => {
    winston.log('verbose', 'Got cars archive page');
    winston.log('verbose', 'Parsing list of cars');
    $('.widgetItemList').find('a').each(function (i, el) {
      $element = $(el);
      const carReferenceInfo = { id: $element.data('id'), url: process.env.BASE_URL + $element.attr('href') };
      winston.log('verbose', 'Got car reference info', carReferenceInfo);
      cars.push(carReferenceInfo);
    });
    return Promise.map(cars, function (carRef) {
      winston.log('verbose', 'Requesting car page for car', carRef);
      return rp({ uri: carRef.url, transform: transformToCheerio })
        .then(($) => {
          winston.log('verbose', 'Got car page for car', carRef);
          Car
            .findOrCreate({ id: carRef.id })
            .then((result) => {
              car = result.doc;
              car.url = carRef.url;
              winston.log('verbose', 'FindOrCreate Car result', car.id);

              // Get model info
              $crumbs = $('p[class=breadcrumbs]').find('a:nth-child(n+2)').toArray();
              car.model.version = extractText($($crumbs.pop()));
              car.model.name = extractText($($crumbs.pop()));
              car.maker = extractText($($crumbs.pop()));
              winston.log('verbose', 'After getting car model info', car.id);

              // Get model image
              car.imageSrc = $('div[class=model-image]').children('img').prop('src');
              winston.log('verbose', 'After getting car image info', car.id);

              // Get all props
              winston.log('verbose', 'Getting car properties for car ' + car.id);
              promises = [];
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
                  winston.log('verbose', 'Got all car properties', car.id);
                  car.save((error, car) => {
                    if (error) return console.error(error);
                    winston.log('verbose', 'Car saved with properties', car.id);
                  });
                }, (error) => {
                  console.error(error);
                })
            });
        })
        .catch((error) => {
          console.error(error);
        });
        winston.log('verbose', 'Fired all get car page requests');
    }, { concurrency: 1 });
  })
  .catch((error) => {
    console.error(error);
  });