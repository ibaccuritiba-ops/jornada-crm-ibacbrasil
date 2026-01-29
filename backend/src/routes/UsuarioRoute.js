const express = require('express');

const UsuarioController = require('../controllers/UsuarioController');
const route = express.Router();

route
    .post('/', UsuarioController.create)
    .post('/passwordupdate', UsuarioController.changePassword)
    .post('/login', UsuarioController.login)
    .get('/', UsuarioController.getUsers)


module.exports = route;