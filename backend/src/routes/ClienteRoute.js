const express = require('express');

const ClienteController = require('../controllers/ClienteController');
const route = express.Router();

route
    .post('/', ClienteController.create)
    .post('/edit', ClienteController.editClienteById)
    .delete('/delete/:id', ClienteController.deleteClienteById)
    .get('/', ClienteController.getClientes)

module.exports = route;