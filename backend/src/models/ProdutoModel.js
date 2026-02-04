const mongoose = require('mongoose');

const ProdutoSchema = new mongoose.Schema({
    empresa: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true },
    nome: {
        type: String,
        required: true
    },
    valor_total: {
        type: Number,
        required: true
    },
    parcelas: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

const ProdutoModel = mongoose.model('Produto', ProdutoSchema);
exports.ProdutoModel = ProdutoModel;
exports.ProdutoSchema = ProdutoSchema;
