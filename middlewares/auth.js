const logErro = require("../utils/logger"); 

function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.isAuthenticated && req.session.userId) {
        return next();
    } else {
        logErro('Acesso não autorizado: Tentativa de acessar rota protegida sem autenticação.');
        return res.status(401).json({ mensagem: 'Acesso não autorizado. Por favor, faça login.' });
    }
}

module.exports = ensureAuthenticated;