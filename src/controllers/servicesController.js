'use strict';

const services = require('../data/services.json');
const images = require('../site/images');

/** Same image treatment as machines: a name in the data, a path only if the file is there. */
function decorate(s) {
  return Object.assign({}, s, { image: images.resolveName(s.imageName, s.title) });
}

exports.list = (req, res) => {
  res.json({ count: services.length, services: services.map(decorate) });
};

exports.getById = (req, res, next) => {
  const service = services.find((s) => s.id === req.params.id);
  if (!service) {
    const err = new Error(`No service with id "${req.params.id}"`);
    err.status = 404;
    err.code = 'not_found';
    return next(err);
  }
  res.json(decorate(service));
};
