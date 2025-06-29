const logErro = require("../utils/logger");
const { ObjectId } = require("mongodb");

class Evento {
    constructor(db) {
        this.collection = db.collection("eventos");
    }

    async inserir(evento) {
        try {
            if (!evento.titulo || !evento.data) {
                throw new Error("Campos obrigatórios faltando: titulo e data");
            }

            const resultado = await this.collection.insertOne(evento);
            return resultado.insertedId;
        } catch (erro) {
            logErro(`Evento.inserir: ${erro.message}`);
            throw erro;
        }
    }

    async buscarPorId(id) {
        try {
            if (!ObjectId.isValid(id)) {
                throw new Error("ID inválido");
            }
            const evento = await this.collection.findOne({ _id: new ObjectId(id) });
            return evento;
        } catch (erro) {
            logErro(`Evento.buscarPorId: ${erro.message}`);
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
            logErro(`Evento.deletar: ${erro.message}`);
            throw erro;
        }
    }

    /**
     * Atualiza um documento de evento pelo seu ID.
     * @param {string} id - O ID (string) do evento a ser atualizado.
     * @param {object} dadosParaAtualizar - Um objeto com os campos e novos valores.
     * @returns {Promise<number>} O número de documentos modificados (0 ou 1).
     */
    async atualizar(id, dadosParaAtualizar) {
        try {
            if (!ObjectId.isValid(id)) {
                throw new Error("ID inválido");
            }
            if (Object.keys(dadosParaAtualizar).length === 0) {
                logErro(`Evento.atualizar: Tentativa de atualizar evento com dados vazios para o ID '${id}'.`);
                return 0;
            }

            const resultado = await this.collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: dadosParaAtualizar }
            );
            return resultado.modifiedCount;
        } catch (erro) {
            logErro(`Evento.atualizar: ${erro.message}`);
            throw erro;
        }
    }
}

module.exports = Evento;