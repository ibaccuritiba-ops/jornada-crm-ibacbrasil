const { ClienteModel } = require('../models/ClienteModel');
const { NegociacaoModel } = require('../models/NegociacaoModel');
const { UsuarioModel } = require('../models/UsuarioModel');

class ClienteController {
    static async create(req, res) {
        const { empresa, nome, email, whatsapp, responsavel, origem, tag, produto, funil, etapa } = req.body

        // Para importação simples (sem funil/etapa), apenas criar o cliente
        if (!funil || !etapa) {
            if (!empresa || !nome || !email) {
                return res.status(400).send({ message: "Data is missing!" });
            }

            const cliente = {
                empresa: empresa,
                nome: nome,
                email: email,
                whatsapp: whatsapp || 'N/A',
                responsavel: responsavel,
                origem: origem,
                tag: tag,
                produto: produto
            }

            try {
                // Se responsavel for 'distribute', fazer rodízio entre usuários da empresa
                if (responsavel === 'distribute') {
                    // Tenta encontrar usuários ativos (sem o campo ativo, pois ele não existe)
                    const usuariosAtivos = await UsuarioModel.find({
                        empresa: empresa,
                        role: { $in: ['vendedor', 'superadmin'] }
                    });

                    if (usuariosAtivos.length === 0) {
                        return res.status(400).send({ message: "Nenhum usuário ativo na empresa" });
                    }

                    // Usar um índice pseudo-aleatório para distribuição
                    const randomIndex = Math.floor(Math.random() * usuariosAtivos.length);
                    cliente.responsavel = usuariosAtivos[randomIndex]._id;
                }

                const createdCliente = await ClienteModel.create(cliente);
                return res.status(201).send({ message: "Cliente created with success!", data: createdCliente })
            } catch (error) {
                return res.status(500).send({ message: "An error ocurred when creating a Cliente.", error: error.message })
            }
        }

        // Caso original: criar cliente + negociação
        if (!empresa || !nome || !email || !whatsapp || !responsavel || !funil || !etapa) {
            return res.status(400).send({ message: "Data is missing!" });
        }

        const cliente = {
            empresa: empresa,
            nome: nome,
            email: email,
            whatsapp: whatsapp || 'N/A',
            responsavel: responsavel,
            origem: origem,
            tag: tag,
            produto: produto
        }

        try {
            const createdCliente = await ClienteModel.create(cliente);

            const negociacao = {
                empresa: empresa,
                cliente: createdCliente._id,
                funil: funil,
                etapa: etapa,
                responsavel: responsavel,
                produto: produto
            }

            await NegociacaoModel.create(negociacao);
            return res.status(201).send({ message: "Cliente created with success!", data: createdCliente })
        } catch (error) {
            console.error('[ClienteController.create] Error:', error);
            return res.status(500).send({ message: "An error ocurred when creating a Cliente.", error: error.message })
        }
    }

    static async getClientes(req, res) {
        try {
            const clientes = await ClienteModel.find()
                .populate('empresa')
                .populate('responsavel', 'nome email');
                
            return res.status(200).send({ message: "Success when searching clientes", data: clientes })
        } catch (error) {
            return res.status(404).send({ message: "Clientes not found.", error: error })
        }
    }

    static async editClienteById(req, res) {
        const { id, ...updates } = req.body;

        try {
            const clienteAtualizado = await ClienteModel.findByIdAndUpdate(
                id, 
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!clienteAtualizado) {
                return res.status(404).send({ message: "Cliente not found" });
            }

            return res.status(200).send({ message: "Success when editing cliente."});
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }

    static async deleteClienteById(req, res) {
        const { id } = req.params;

        try {
            const deletedCliente = await ClienteModel.findByIdAndDelete(id);

            if (!deletedCliente) {
                return res.status(404).send({ message: "Cliente not found" });
            }

            return res.status(200).send({ message: "Cliente deleted successfully." });
        } catch (error) {
            return res.status(500).send({ error: error.message });
        }
    }
}

module.exports = ClienteController;