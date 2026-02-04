const mongoose = require('mongoose');
const { EmpresaSchema } = require('./EmpresaModel');

const UsuarioSchema = new mongoose.Schema({
    empresa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: false
    },
    nome: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    senha: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ['proprietario', 'superadmin', 'vendedor'],
        required: true,
        default: 'vendedor'
    },
    ativo: {
        type: Boolean,
        required: true,
        default: true
    },
    acessos: {
        type: [String],
        enum: ['leads', 'negocios', 'importacao', 'relatorios', 'produtos', 'config.conta', 'branding', 'config.funil', 'agenda'],
        required: false,
        default: ['leads', 'negocios', 'importacao', 'relatorios', 'produtos', 'config.conta', 'branding', 'config.funil', 'agenda']
    }
}, { timestamps: true });

const UsuarioModel = mongoose.model('Usuario', UsuarioSchema);
exports.UsuarioModel = UsuarioModel;
exports.UsuarioSchema = UsuarioSchema;