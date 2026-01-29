const mongoose = require('mongoose');

const EmpresaSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    cnpj: {
        type: String,
        required: true
    },
    cor_principal: {
        type: String,
        required: true
    },
    cor_destaque: {
        type: String,
        required: true
    },
    logo_url: {
        type: String,
        required: false
    }
}, { timestamps: true });

const EmpresaModel = mongoose.model('Empresa', EmpresaSchema);
exports.EmpresaModel = EmpresaModel;
exports.EmpresaSchema = EmpresaSchema;