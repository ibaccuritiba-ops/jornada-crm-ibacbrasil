const { ProdutoModel } = require('../models/ProdutoModel');

class ProdutoController {
    static async create(req, res) {
        const { empresa, nome, valor_total, parcelas } = req.body;

        if (!empresa || !nome || !valor_total)
            return res.status(400).send({ message: "Data is missing!" });

        const produto = {
            empresa: empresa,
            nome: nome,
            valor_total: valor_total,
            parcelas: parcelas || 1
        };

        try {
            const createdProduto = await ProdutoModel.create(produto);
            return res.status(201).send({ message: "Produto created with success!", data: createdProduto });
        } catch (error) {
            return res.status(500).send({ message: "An error occurred when creating a Produto.", error: error.message });
        }
    }

    static async getAllProdutos(req, res) {
        try {
            const produtos = await ProdutoModel.find()
                .populate('empresa');
            
            return res.status(200).send({ message: "Success when searching all produtos", data: produtos });
        } catch (error) {
            return res.status(404).send({ message: "Produtos not found.", error: error.message });
        }
    }

    static async getProdutos(req, res) {
        const { empresaId } = req.params;

        try {
            const produtos = await ProdutoModel.find({ empresa: empresaId })
                .populate('empresa');
            
            return res.status(200).send({ message: "Success when searching produtos", data: produtos });
        } catch (error) {
            return res.status(404).send({ message: "Produtos not found.", error: error.message });
        }
    }

    static async editProdutoById(req, res) {
        const { id, ...updates } = req.body;

        try {
            const produtoAtualizado = await ProdutoModel.findByIdAndUpdate(
                id,
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!produtoAtualizado) {
                return res.status(404).send({ message: "Produto not found" });
            }

            return res.status(200).send({ message: "Success when editing produto.", data: produtoAtualizado });
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }

    static async deleteProdutoById(req, res) {
        const { id } = req.body;

        try {
            const produtoDeletado = await ProdutoModel.findByIdAndDelete(id);

            return res.status(200).send({ message: "Produto deleted with success.", data: produtoDeletado });
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }
}

module.exports = ProdutoController;
