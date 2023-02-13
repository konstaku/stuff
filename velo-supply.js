'use strict'

const makeElement = function(element, text) {
  let h =  document.createElement(element);
  let ht = document.createTextNode(text);
  h.appendChild(ht);

  document.body.appendChild(h);
}

const getVeloStats = () => {
  fetch('https://api.velodrome.finance/api/v1/supply')
    .then(data => data.json())
    .then(info => console.log(Math.trunc( info.data.raw_locked_supply / 10**18 / 10**6 ),  'millions'));
};

makeElement('p', 'lol');
getVeloStats();

