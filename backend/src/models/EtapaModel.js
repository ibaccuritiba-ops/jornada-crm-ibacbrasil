const mongoose = require('mongoose');
const { FunilSchema } = require('./FunilModel');

const EtapaSchema = new mongoose.Schema({
    funil: { type: mongoose.Schema.Types.ObjectId, ref: 'Funil', required: true },
    nome: {
        type: String,
        required: true
    },
    ordem: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const EtapaModel = mongoose.model('Etapa', EtapaSchema);
exports.EtapaModel = EtapaModel;
exports.EtapaSchema = EtapaSchema;