const logErro = require("../utils/logger");
const { ObjectId } = require("mongodb");

class Categoria {
    constructor(db) {
        this.collection = db.collection("categorias");
    }

    async inserir(categoria) {
        try {
            if (!categoria.nome) {
                throw new Error("Campo obrigatório faltando: nome");
            }

            const resultado = await this.collection.insertOne(categoria);
            return resultado.insertedId;
        } catch (erro) {
            logErro(`Categoria.inserir: ${erro.message}`);
            throw erro;
        }
    }

    async buscarPorId(id) {
        try {
            if (!ObjectId.isValid(id)) {
                throw new Error("ID inválido");
            }
            const categoria = await this.collection.findOne({ _id: new ObjectId(id) });
            return categoria;
        } catch (erro) {
            logErro(`Categoria.buscarPorId: ${erro.message}`);
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
            logErro(`Categoria.deletar: ${erro.message}`);
            throw erro;
        }
    }

    /**
     * Atualiza um documento de categoria pelo seu ID.
     * @param {string} id - O ID (string) da categoria a ser atualizada.
     * @param {object} dadosParaAtualizar - Um objeto com os campos e novos valores.
     * @returns {Promise<number>} O número de documentos modificados (0 ou 1).
     */
    async atualizar(id, dadosParaAtualizar) {
        try {
            if (!ObjectId.isValid(id)) {
                throw new Error("ID inválido");
            }
            if (Object.keys(dadosParaAtualizar).length === 0) {
                // Nenhuma atualização para fazer, pode ser um caso de aviso ou erro
                logErro(`Categoria.atualizar: Tentativa de atualizar categoria com dados vazios para o ID '${id}'.`);
                return 0; // Nenhum documento modificado
            }

            const resultado = await this.collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: dadosParaAtualizar }
            );
            return resultado.modifiedCount;
        } catch (erro) {
            logErro(`Categoria.atualizar: ${erro.message}`);
            throw erro;
        }
    }
}

module.exports = Categoria;