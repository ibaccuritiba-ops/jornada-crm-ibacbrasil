const express = require('express');
const ClienteRoute = require('../src/routes/ClienteRoute');
const EmpresaRoute = require('../src/routes/EmpresaRoute');
const EtapaRoute = require('../src/routes/EtapaRoute');
const FunilRoute = require('../src/routes/FunilRoute');
const NegociacaoRoute = require('../src/routes/NegociacaoRoute');
const UsuarioRoute = require('../src/routes/UsuarioRoute');

module.exports = function(app) {
    app
        .use(express.json())
        .use('/cliente', ClienteRoute)
        .use('/empresa', EmpresaRoute)
        .use('/etapa', EtapaRoute)
        .use('/funil', FunilRoute)
        .use('/negociacao', NegociacaoRoute)
        .use('/usuario', UsuarioRoute)
}