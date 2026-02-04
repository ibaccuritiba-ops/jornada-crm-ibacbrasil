const { UsuarioModel } = require('../models/UsuarioModel');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class UsuarioController {
    static async create(req, res) {
        const { empresa, nome, email, senha, role } = req.body;

        // Proprietários não precisam de empresa vinculada
        if (!nome || !email || !senha || !role) return res.status(400).send({ message: "Data is missing!" });
        if (role !== 'proprietario' && !empresa) return res.status(400).send({ message: "Empresa is required for non-proprietario users!" });

        const usuario = {
            nome: nome,
            email: email,
            senha: senha,
            role: role
        };

        // Só adiciona empresa se não for proprietário
        if (role !== 'proprietario') {
            usuario.empresa = empresa;
        }

        try {
            await UsuarioModel.create(usuario);
            return res.status(201).send({ message: "Success when creating Usuario!" })
        } catch (error) {
            return res.status(500).send({ message: "Error when creating Usuario.", error: error })
        }
    }

    static async getUsers(req, res) {
        try {
            const users = await UsuarioModel.find().populate('empresa');
            
            return res.status(200).send({ message: "Success when searching for Usuarios", data: users });
        } catch (error) {
            return res.status(404).send({ message: "Usuarios not found!" });
        }
    }

    static async changePassword(req, res) {
        const { id, newPassword } = req.body;
        
        if (!newPassword || !id) {
            return res.status(400).send({ message: "Dados inválidos." });
        }

        try {
            await UsuarioModel.findByIdAndUpdate(id, {
                senha: newPassword
            });

            return res.status(200).send({ message: "Senha alterada com sucesso!" });
        } catch (error) {
            return res.status(500).send({ message: "Erro ao trocar senha", error: error.message });
        }
    }

    static async login(req, res) {
        const { email, password } = req.body;

        try {
            const user = await UsuarioModel.findOne({ email }).select('+senha').populate('empresa');

            if (!user) {
                return res.status(404).send({ message: "Email or password invalid." });
            }

            const bytesInput = CryptoJS.AES.decrypt(password, process.env.SECRET);
            const senhaDigitada = bytesInput.toString(CryptoJS.enc.Utf8);

            const bytesBanco = CryptoJS.AES.decrypt(user.senha, process.env.SECRET);
            const senhaBanco = bytesBanco.toString(CryptoJS.enc.Utf8);

            if (senhaDigitada !== senhaBanco) {
                return res.status(401).send({ message: "Email or password invalid." });
            }

            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
                expiresIn: '8h'
            });

            user.senha = undefined;
            return res.status(200).send({
                message: "Login has been a success!",
                token,
                user
            });

        } catch (error) {
            return res.status(500).send({ message: "Internal error.", error: error });
        }
    }
}

module.exports = UsuarioController;