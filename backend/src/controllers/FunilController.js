const { FunilModel } = require("../models/FunilModel");

class FunilController {
    static async create(req, res) {
        const { empresa, nome } = req.body;

        if (!empresa || !nome) return res.status(400).send({ message: "Data is missing!" });

        const funil = {
            empresa: empresa,
            nome: nome
        }

        try {
            await FunilModel.create(funil);
            return res.status(201).send({ message: "Success when creating Funil" });
        } catch (error) {
            return res.status(500).send({ message: "Error when creating a Funil", error: error });
        }
    }

    static async getFunis(req, res) {
        try {
            const funis = await FunilModel.find().populate('empresa');
            
            return res.status(200).send({ message: "Success when searching funis", data: funis })
        } catch (error) {
            return res.status(404).send({ message: "Funis not found.", error: error })
        }
    }

    static async getFunisByEmpresa(req, res) {
        const { empresaId } = req.params;

        try {
            const funis = await FunilModel.find({ empresa: empresaId });

            return res.status(200).send({ message: "Success when searching funis", data: funis })
        } catch (error) {
            return res.status(404).send({ message: "Funis not found.", error: error })
        }
    }

    static async editFunilById(req, res) {
        const { id, ...updates } = req.body;

        try {
            const funilAtualizado = await FunilModel.findByIdAndUpdate(
                id, 
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!funilAtualizado) {
                return res.status(404).send({ message: "Funil not found" });
            }

            return res.status(200).send({ message: "Success when editing funil."});
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }

    static async deleteFunilById(req, res) {
        const { id } = req.params;

        try {
            await FunilModel.findByIdAndDelete(id);
            return res.status(200).send({ message: `Success when deleting Funil ${id}.`})
        } catch (error) {
            return res.status(500).send({ message: "Error when deleting Funil", error: error})
        }
    }
}

module.exports = FunilController;