const { NegociacaoModel } = require('../models/NegociacaoModel');

class NegociacaoController {
    static async create(req, res) {
        const { cliente, funil, etapa, responsavel, empresa, status } = req.body;

        if (!cliente || !funil || !etapa || !responsavel || !empresa) {
            return res.status(400).send({ message: "Data is missing!" });
        }

        try {
            const negociacao = {
                cliente,
                funil,
                etapa,
                responsavel,
                empresa,
                status: status || 'aberto'
            };

            const createdNegociacao = await NegociacaoModel.create(negociacao);
            return res.status(201).send({ 
                message: "Negociação created with success!", 
                data: createdNegociacao 
            });
        } catch (error) {
            return res.status(500).send({ 
                message: "An error occurred when creating a Negociação.", 
                error: error.message 
            });
        }
    }

    static async getAllNegociacoes(req, res) {
        try {
            const negociacoes = await NegociacaoModel.find()
                .populate('cliente')
                .populate('responsavel')
                .populate('etapa')
                .populate('empresa')
                .populate('produtos');

            return res.status(200).send({
                message: "Negociações found!",
                data: negociacoes
            });

        } catch (error) {
            return res.status(500).send({
                message: "Error when searching Negociações.",
                error: error.message
            });
        }
    }

    static async getNegByFunil(req, res) {
        const { funilId } = req.params;

        try {
            const negociacoes = await NegociacaoModel.find({ funil: funilId })
                .populate('cliente')
                .populate('responsavel')
                .populate('etapa')
                .populate('produtos');

            return res.status(200).send({
                message: "Negociações found!",
                data: negociacoes
            });

        } catch (error) {
            return res.status(500).send({
                message: "Error when searching Negociações.",
                error: error.message
            });
        }
    }

    static async updateEtapa(req, res) {
        const { id, novaEtapaId, negociacaoId, etapaId } = req.body;
        const negId = id || negociacaoId;
        const newStageId = novaEtapaId || etapaId;

        try {
            const updated = await NegociacaoModel.findByIdAndUpdate(negId, {
                etapa: newStageId
            }, { new: true });

            return res.status(200).send({ message: "Card moved with success!", data: updated });
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }

    static async updateNegById(req, res) {
        const { id, ...updates } = req.body;

        try {
            const negociacaoAtualizada = await NegociacaoModel.findByIdAndUpdate(
                id,
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!negociacaoAtualizada) {
                return res.status(404).send({ message: "Negociação not found" });
            }

            return res.status(200).send({ message: "Success when editing negociacao.", data: negociacaoAtualizada });
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }

    static async addTarefaById(req, res) {
        const { negociacaoId, tarefa } = req.body;

        try {
            const tarefaFormatada = {
                titulo: tarefa.titulo,
                tipo: tarefa.tipo.toLowerCase(),
                data: tarefa.data,
                concluida: tarefa.concluida
            };

            const negociacaoAtualizada = await NegociacaoModel.findByIdAndUpdate(
                negociacaoId,
                { $push: { tarefas: tarefaFormatada } },
                { new: true, runValidators: true }
            );

            if (!negociacaoAtualizada) {
                return res.status(404).send({ message: "Negociação not found" });
            }

            return res.status(201).send({
                message: "Tarefa added with success.",
                data: negociacaoAtualizada
            });
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }

    static async updateTarefa(req, res) {
        const { negociacaoId, tarefaId, updates } = req.body;

        try {
            const negociacao = await NegociacaoModel.findById(negociacaoId);

            if (!negociacao) {
                return res.status(404).send({ message: "Negociação not found" });
            }

            const tarefa = negociacao.tarefas.id(tarefaId);
            
            if (!tarefa) {
                return res.status(404).send({ message: "Tarefa not found" });
            }

            if (updates.titulo) tarefa.titulo = updates.titulo;
            if (updates.tipo) tarefa.tipo = updates.tipo.toLowerCase();
            if (updates.data) tarefa.data = updates.data;
            if (updates.hasOwnProperty('concluida')) tarefa.concluida = updates.concluida;

            await negociacao.save();

            return res.status(200).send({
                message: "Tarefa updated with success.",
                data: negociacao
            });
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }

    static async deleteTarefa(req, res) {
        const { negociacaoId, tarefaId } = req.body;

        try {
            const negociacao = await NegociacaoModel.findById(negociacaoId);

            if (!negociacao) {
                return res.status(404).send({ message: "Negociação not found" });
            }

            const tarefa = negociacao.tarefas.id(tarefaId);
            
            if (!tarefa) {
                return res.status(404).send({ message: "Tarefa not found" });
            }

            tarefa.deleteOne();
            await negociacao.save();

            return res.status(200).send({
                message: "Tarefa deleted with success.",
                data: negociacao
            });
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }

    static async addProdutoToNeg(req, res) {
        const { negociacaoId, produtoId } = req.body;

        try {
            const negociacao = await NegociacaoModel.findById(negociacaoId);
            
            if (!negociacao) {
                return res.status(404).send({ message: "Negociação not found" });
            }

            const produtoJaExiste = negociacao.produtos.some(p => String(p) === String(produtoId));
            
            if (produtoJaExiste) {
                return res.status(400).send({ message: "Este produto já foi adicionado a esta negociação" });
            }

            const negociacaoAtualizada = await NegociacaoModel.findByIdAndUpdate(
                negociacaoId,
                { $push: { produtos: produtoId } },
                { new: true, runValidators: true }
            ).populate('produtos');

            return res.status(201).send({
                message: "Produto added to negociação with success.",
                data: negociacaoAtualizada
            });
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }

    static async removeProdutoFromNeg(req, res) {
        const { negociacaoId, produtoId } = req.body;

        try {
            const negociacaoAtualizada = await NegociacaoModel.findByIdAndUpdate(
                negociacaoId,
                { $pull: { produtos: produtoId } },
                { new: true }
            ).populate('produtos');

            if (!negociacaoAtualizada) {
                return res.status(404).send({ message: "Negociação not found" });
            }

            return res.status(200).send({
                message: "Produto removed from negociação with success.",
                data: negociacaoAtualizada
            });
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }
}

module.exports = NegociacaoController;