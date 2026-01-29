const express = require('express');

const EtapaController = require('../controllers/EtapaController');
const route = express.Router();

route
    .post('/', EtapaController.create)
    .post('/updatename', EtapaController.editEtapaById)
    .post('/updateorder', EtapaController.updateOrder)
    .get('/', EtapaController.getEtapas)
    .get('/:funilId', EtapaController.getEtapasByFunil)

module.exports = route;