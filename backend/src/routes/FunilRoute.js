const express = require('express');

const FunilController = require('../controllers/FunilController');
const route = express.Router();

route
    .post('/', FunilController.create)
    .post('/update', FunilController.editFunilById)
    .get('/', FunilController.getFunis)
    .get('/:empresaId', FunilController.getFunisByEmpresa)
    .delete('/delete/:id', FunilController.deleteFunilById)

module.exports = route;