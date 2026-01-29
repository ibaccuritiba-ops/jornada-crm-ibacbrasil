const { EmpresaModel } = require('../models/EmpresaModel');

class EmpresaController {
    static async create(req, res) {
        const { nome, cnpj, cor_principal, cor_destaque, logo_url } = req.body

        if (!nome || !cnpj || !cor_principal || !cor_destaque)
            return res.status(400).send({ message: "Data is missing!" });

        const empresa = {
            nome: nome,
            cnpj: cnpj,
            cor_principal: cor_principal,
            cor_destaque: cor_destaque,
            logo_url: logo_url
        }

        try {
            await EmpresaModel.create(empresa);
            return res.status(201).send({ message: "Empresa created with success!" })
        } catch (error) {
            return res.status(500).send({ message: "An error ocurred when creating an Empresa.", error: error.message })
        }
    }

    static async getEmpresas(req, res) {
        try {
            const empresas = await EmpresaModel.find();
            return res.status(200).send({ message: "Success when searching empresas", data: empresas })
        } catch (error) {
            return res.status(404).send({ message: "Empresas not found.", error: error })
        }
    }

    static async editEmpresaById(req, res) {
        const { id, ...updates } = req.body;

        try {
            const empresaAtualizada = await EmpresaModel.findByIdAndUpdate(
                id, 
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!empresaAtualizada) {
                return res.status(404).send({ message: "Empresa not found" });
            }

            return res.status(200).send({ message: "Success when editing empresa."});
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }

    static async deleteEmpresaById(req, res) {
        const { id } = req.params;

        try {
            await EmpresaModel.findByIdAndDelete(id);

            return res.status(200).send({ message: `Success when deleting Empresa ${id}.`})
        } catch (error) {
            return res.status(500).send({ message: "Error when deleting Empresa", error: error})
        }
    }
}

module.exports = EmpresaController;