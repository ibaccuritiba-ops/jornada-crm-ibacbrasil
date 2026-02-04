const express = require('express');

const ProdutoController = require('../controllers/ProdutoController');
const route = express.Router();

route
    .get('/', ProdutoController.getAllProdutos)
    .post('/create', ProdutoController.create)
    .post('/edit', ProdutoController.editProdutoById)
    .post('/delete', ProdutoController.deleteProdutoById)
    .get('/:empresaId', ProdutoController.getProdutos)

module.exports = route;
