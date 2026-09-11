'use strict';

const machines = require('../data/machines.json');
const images = require('../site/images');

/**
 * Machines carry the file name of their photograph rather than a path, and it
 * is resolved here, at request time, against what is actually in
 * public/assets/img. So a machine whose picture has not been uploaded yet
 * comes back with `image: null` and the card draws its labelled plate, and the
 * day the file lands the same record starts carrying a real path.
 */
function decorate(m) {
  return Object.assign({}, m, { image: images.resolveName(m.imageName, m.name) });
}

exports.list = (req, res) => {
  const { category, condition } = req.query;
  let result = machines;
  if (category && String(category).toLowerCase() !== 'all') {
    result = result.filter((m) => m.category.toLowerCase() === String(category).toLowerCase());
  }
  if (condition) {
    result = result.filter((m) => m.condition.toLowerCase() === String(condition).toLowerCase());
  }
  res.json({
    count: result.length,
    categories: Array.from(new Set(machines.map((m) => m.category))),
    machines: result.map(decorate),
  });
};

exports.getById = (req, res, next) => {
  const machine = machines.find((m) => m.id === req.params.id);
  if (!machine) {
    const err = new Error(`No machine with id "${req.params.id}"`);
    err.status = 404;
    err.code = 'not_found';
    return next(err);
  }
  // include the following machine for next-machine navigation
  const idx = machines.findIndex((m) => m.id === machine.id);
  const nextMachine = machines[(idx + 1) % machines.length];
  res.json({ machine: decorate(machine), next: { id: nextMachine.id, name: nextMachine.name, model: nextMachine.model } });
};
