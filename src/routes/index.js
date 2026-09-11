'use strict';

/**
 * API router. Mounts feature routers under /api.
 */

const router = require('express').Router();

const system = require('../controllers/systemController');

router.get('/health', system.health);
router.get('/public-config', system.publicConfig);
router.get('/site', require('../controllers/siteController').get);

router.use('/services', require('./services'));
router.use('/machines', require('./machines'));
router.use('/careers', require('./careers'));
router.use('/contact', require('./contact'));
router.use('/applications', require('./applications'));
router.use('/chat', require('./chat'));
router.use('/emails', require('./emails'));

module.exports = router;
