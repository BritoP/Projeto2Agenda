const { MongoClient } = require("mongodb");
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

async function conectar() {
    try {
        await client.connect();
        console.log("Conectado ao Servidor Local MongoDB");
        return client.db("agenda");
    } catch (err) {
        console.error("Erro ao se conectar:", err);
        throw err;
    }
}

module.exports = conectar;