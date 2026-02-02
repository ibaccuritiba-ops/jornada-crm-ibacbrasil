const { NegociacaoModel } = require('../models/NegociacaoModel');

class NegociacaoController {
    static async getNegByFunil(req, res) {
        const { funilId } = req.params;

        try {
            const negociacoes = await NegociacaoModel.find({ funil: funilId })
                .populate('cliente')
                .populate('responsavel')
                .populate('etapa');

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
        const { id, novaEtapaId } = req.body;

        try {
            await NegociacaoModel.findByIdAndUpdate(id, {
                etapa: novaEtapaId
            });

            return res.status(200).send({ message: "Card moved with success!" });
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
            const negociacaoAtualizada = await NegociacaoModel.findByIdAndUpdate(
                negociacaoId,
                { $push: { tarefas: tarefa } },
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
            const negociacaoAtualizada = await NegociacaoModel.findByIdAndUpdate(
                negociacaoId,
                { $set: { "tarefas.$[elem]": updates } },
                { 
                    arrayFilters: [{ "elem._id": tarefaId }],
                    new: true,
                    runValidators: true
                }
            );

            if (!negociacaoAtualizada) {
                return res.status(404).send({ message: "Negociação not found" });
            }

            return res.status(200).send({ 
                message: "Tarefa updated with success.", 
                data: negociacaoAtualizada 
            });
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }
}

module.exports = NegociacaoController;