const express = require('express');

const NegociacaoController = require('../controllers/NegociacaoController');
const route = express.Router();

route
    .get('/', NegociacaoController.getAllNegociacoes)
    .post('/', NegociacaoController.create)
    .post('/updateetapa', NegociacaoController.updateEtapa)
    .post('/updatebyid', NegociacaoController.updateNegById)
    .post('/addtarefa', NegociacaoController.addTarefaById)
    .post('/updatetarefa', NegociacaoController.updateTarefa)
    .post('/deletetarefa', NegociacaoController.deleteTarefa)
    .post('/addproduto', NegociacaoController.addProdutoToNeg)
    .post('/removeproduto', NegociacaoController.removeProdutoFromNeg)
    .get('/:funilId', NegociacaoController.getNegByFunil)

module.exports = route;