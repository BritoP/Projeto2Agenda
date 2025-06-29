const logErro = require("../utils/logger");
const { ObjectId } = require("mongodb");

class Usuario {
    constructor(db) {
        this.collection = db.collection("usuarios");
    }

    async inserir(usuario) {
        try {
            if (!usuario.nome || !usuario.email) {
                throw new Error("Campos obrigatórios faltando: nome e email");
            }

            const resultado = await this.collection.insertOne(usuario);
            return resultado.insertedId;
        } catch (erro) {
            logErro(`Usuario.inserir: ${erro.message}`);
            throw erro;
        }
    }

    async buscarPorId(id) {
        try {
            if (!ObjectId.isValid(id)) {
                throw new Error("ID inválido");
            }
            const usuario = await this.collection.findOne({ _id: new ObjectId(id) });
            return usuario;
        } catch (erro) {
            logErro(`Usuario.buscarPorId: ${erro.message}`);
            throw erro;
        }
    }

    async deletar(id) {
        try {
            if (!ObjectId.isValid(id)) {
                throw new Error("ID inválido");
            }
            const resultado = await this.collection.deleteOne({ _id: new ObjectId(id) });
            return resultado.deletedCount;
        } catch (erro) {
            logErro(`Usuario.deletar: ${erro.message}`);
            throw erro;
        }
    }

    /**
     * Atualiza um documento de usuário pelo seu ID.
     * @param {string} id - O ID (string) do usuário a ser atualizado.
     * @param {object} dadosParaAtualizar - Um objeto com os campos e novos valores.
     * @returns {Promise<number>} O número de documentos modificados (0 ou 1).
     */
    async atualizar(id, dadosParaAtualizar) {
        try {
            if (!ObjectId.isValid(id)) {
                throw new Error("ID inválido");
            }
            if (Object.keys(dadosParaAtualizar).length === 0) {
                logErro(`Usuario.atualizar: Tentativa de atualizar usuário com dados vazios para o ID '${id}'.`);
                return 0;
            }

            const resultado = await this.collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: dadosParaAtualizar }
            );
            return resultado.modifiedCount;
        } catch (erro) {
            logErro(`Usuario.atualizar: ${erro.message}`);
            throw erro;
        }
    }
}

module.exports = Usuario;