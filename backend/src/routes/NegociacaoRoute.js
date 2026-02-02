const express = require('express');

const NegociacaoController = require('../controllers/NegociacaoController');
const route = express.Router();

route
    .post('/updateetapa', NegociacaoController.updateEtapa)
    .post('/updatebyid', NegociacaoController.updateNegById)
    .post('/addtarefa', NegociacaoController.addTarefaById)
    .post('/updatetarefa', NegociacaoController.updateTarefa)
    .get('/:funilId', NegociacaoController.getNegByFunil)

module.exports = route;