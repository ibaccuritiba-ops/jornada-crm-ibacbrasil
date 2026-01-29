const mongoose = require('mongoose');
const { EmpresaSchema } = require('./EmpresaModel');

const FunilSchema = new mongoose.Schema({
    empresa: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true },
    nome: {
        type: String,
        required: true
    }
}, { timestamps: true });

const FunilModel = mongoose.model('Funil', FunilSchema);
exports.FunilModel = FunilModel;
exports.FunilSchema = FunilSchema;