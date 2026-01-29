const express = require('express');

const NegociacaoController = require('../controllers/NegociacaoController');
const route = express.Router();

route
    .post('/updateetapa', NegociacaoController.updateEtapa)
    .get('/:funilId', NegociacaoController.getNegByFunil)

module.exports = route;