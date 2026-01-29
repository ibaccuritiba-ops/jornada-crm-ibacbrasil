const { EtapaModel } = require('../models/EtapaModel');

class EtapaController {
    static async create(req, res) {
        const { funil, nome } = req.body

        if (!funil || !nome)
            return res.status(400).send({ message: "Data is missing!" });

        const lastAddedEtapa = await EtapaModel.findOne({ funil }).sort({ ordem: -1 })

        const etapa = {
            funil: funil,
            nome: nome,
            ordem: lastAddedEtapa ? lastAddedEtapa.ordem + 1 : 0
        }

        try {
            await EtapaModel.create(etapa);
            return res.status(201).send({ message: "Etapa created with success!" })
        } catch (error) {
            return res.status(500).send({ message: "An error ocurred when creating a Etapa.", error: error.message })
        }
    }

    static async getEtapas(req, res) {
        try {
            const etapas = await EtapaModel.find().populate('funil');
            
            return res.status(200).send({ message: "Success when searching etapas", data: etapas })
        } catch (error) {
            return res.status(404).send({ message: "Etapas not found.", error: error })
        }
    }

    static async getEtapasByFunil(req, res) {
        const { funilId } = req.params;

        try {
            const etapas = await EtapaModel.find({ funil: funilId }).sort({ ordem: 1 });

            return res.status(200).send({ 
                message: "Etapas found with success!", 
                data: etapas 
            });
        } catch (error) {
            return res.status(404).send({ 
                message: "Error when searching Etapas from Funil.", 
                error: error.message 
            });
        }
    }

    static async editEtapaById(req, res) {
        const { id, ...updates } = req.body;

        try {
            const etapaAtualizada = await EtapaModel.findByIdAndUpdate(
                id, 
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!etapaAtualizada) {
                return res.status(404).send({ message: "Etapa not found" });
            }

            return res.status(200).send({ message: "Success when editing Etapa."});
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }

    static async updateOrder(req, res) {
        const { etapaId, newPosition } = req.body;

        try {
            const movedEtapa = await EtapaModel.findById(etapaId);
            if (!movedEtapa) return res.status(404).send("Etapa não encontrada");

            const oldPosition = movedEtapa.ordem;
            const funilId = movedEtapa.funil;

            if (newPosition > oldPosition) {
                await EtapaModel.updateMany(
                    {
                        funil: funilId,
                        ordem: { $gt: oldPosition, $lte: newPosition }
                    },
                    { $inc: { ordem: -1 } }
                );
            } else if (newPosition < oldPosition) {
                await EtapaModel.updateMany(
                    {
                        funil: funilId,
                        ordem: { $gte: newPosition, $lt: oldPosition }
                    },
                    { $inc: { ordem: 1 } }
                );
            }

            movedEtapa.ordem = newPosition;
            await movedEtapa.save();

            return res.status(200).send({ message: "Ordem updated with success!" });
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }
}

module.exports = EtapaController;