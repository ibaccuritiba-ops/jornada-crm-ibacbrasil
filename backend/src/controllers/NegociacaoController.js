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
}

module.exports = NegociacaoController;