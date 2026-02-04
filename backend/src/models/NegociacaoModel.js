const mongoose = require('mongoose');
const { EmpresaSchema } = require('./EmpresaModel');
const { ClienteSchema } = require('./ClienteModel');
const { EtapaSchema } = require('./EtapaModel');
const { UsuarioSchema } = require('./UsuarioModel');
const { FunilSchema } = require('./FunilModel');
const { ProdutoSchema } = require('./ProdutoModel');

const TarefaSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        enum: ['ligacao', 'whatsapp', 'email'],
        required: true,
        default: 'ligacao'
    },
    data: {
        type: Date,
        required: true
    },
    concluida: {
        type: Boolean,
        default: false
    }
});

const NegociacaoSchema = new mongoose.Schema({
    empresa: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true },
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    funil: { type: mongoose.Schema.Types.ObjectId, ref: 'Funil', required: true },
    etapa: { type: mongoose.Schema.Types.ObjectId, ref: 'Etapa', required: true },
    responsavel: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    status: {
        type: String,
        enum: ['aberta', 'ganha', 'perdida'],
        default: 'aberta',
        required: false
    },

    tarefas: [TarefaSchema],
    produtos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Produto' }] 
}, { timestamps: true });

const NegociacaoModel = mongoose.model('Negociacao', NegociacaoSchema);
exports.NegociacaoModel = NegociacaoModel;
exports.NegociacaoSchema = NegociacaoSchema;
exports.TarefaSchema = TarefaSchema;
exports.ProdutoSchema = ProdutoSchema;