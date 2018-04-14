require('dotenv').load();
const rp = require('request-promise');
const cheerio = require('cheerio');

const options = {
  uri: process.env.DOMAIN,
  transform: function (body) {
    return cheerio.load(body);
  }
};

let car = { 
  props: [] 
};

const extractText = function ($element) {
  return $element.text().trim();
}

rp(options)
  .then(($) => {
    // Get model name
    $modelElement = $('h1[class=model-title]');
    $modelVersionElement = $modelElement.children('small');
    car.modelVersion = extractText($modelVersionElement);
    $modelVersionElement.remove();
    car.modelName = extractText($modelElement);
    // Get model make
    // Get model image
    car.image = $('div[class=model-image]').children('img').prop('src');
    // Get all props
    $('table[class=articleAccordian-FixFontColorToWhite]')
      .find('td[class=propValue]')
      .each(function (i, el) {
        $this = $(this);
        $propName = $this.prev('td');
        car.props.push({
          propName: extractText($propName),
          propID: $this.data('propid'),
          value: extractText($this)
        });
      });
    console.log(car);
  })
  .catch((err) => {
    console.log(err);
  });