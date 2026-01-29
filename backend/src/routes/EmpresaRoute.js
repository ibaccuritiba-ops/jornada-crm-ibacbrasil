const express = require('express');

const EmpresaController = require('../controllers/EmpresaController');
const route = express.Router();

route
    .post('/', EmpresaController.create)
    .post('/edit', EmpresaController.editEmpresaById)
    .get('/', EmpresaController.getEmpresas)
    .delete('/delete/:id', EmpresaController.deleteEmpresaById)

module.exports = route;