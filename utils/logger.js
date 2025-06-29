const fs = require("fs");
const path = require("path");

function logErro(mensagem) {
    const caminho = path.join(__dirname, "../logs/erros.log");
    const horario = new Date().toISOString();
    const linha = `[${horario}] ${mensagem}\n`;

    fs.appendFile(caminho, linha, (err) => {
        if (err) console.error("Erro ao gravar log:", err);
    });
}

module.exports = logErro;