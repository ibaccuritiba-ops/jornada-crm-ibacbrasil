const mongoose = require('mongoose');
const { EmpresaSchema } = require('./EmpresaModel');
const { UsuarioSchema } = require('./UsuarioModel');

const ClienteSchema = new mongoose.Schema({
    empresa: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true },
    nome: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    whatsapp: {
        type: String,
        required: true
    },
    responsavel: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    origem: {
        type: String,
        required: false
    },
    tag: {
        type: String,
        required: false
    },
    rating: {
        type: Number,
        required: false,
        default: 3
    },
    excluido: {
        type: Boolean,
        required: false,
        default: false
    }
}, { timestamps: true });

const ClienteModel = mongoose.model('Cliente', ClienteSchema);
exports.ClienteModel = ClienteModel;
exports.ClienteSchema = ClienteSchema;