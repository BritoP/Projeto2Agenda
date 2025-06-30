const express = require('express');
const session = require('express-session');
const conectarDB = require('./database/conexao'); 
const Usuario = require('./classes/Usuario');
const Evento = require('./classes/Evento');
const Categoria = require('./classes/Categoria');
const logErro = require('./utils/logger'); 
const ensureAuthenticated = require('./middlewares/auth');

const app = express();
const port = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true })); 


app.use(session({
    secret: 'SegredoSegredosoExtremamenteSecreto123', 
    resave: false, 
    saveUninitialized: false, 
    cookie: {
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 1000 * 60 * 60 * 24 
    }
}));


app.use(async (req, res, next) => {
    try {
        const db = await conectarDB(); 
        req.db = db; 
        req.usuarioDb = new Usuario(req.db); 
        req.eventoDb = new Evento(req.db);   
        req.categoriaDb = new Categoria(req.db); 
        next(); 
    } catch (error) {
        logErro(`Erro na conexão com o DB ou instanciação das classes: ${error.message}`);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao conectar ao banco de dados.' });
    }
});



app.get('/', (req, res) => {
    res.json({ mensagem: 'Bem-vindo à API da Agenda! Utilize os endpoints /usuarios, /eventos, /categorias.' });
});


app.post('/usuarios', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        if (!nome || !email || !senha) {
            logErro('Usuário.inserir: Campos obrigatórios faltando (nome, email, senha).');
            return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios.' });
        }
        const usuarioData = { nome, email, senha };
        const insertedId = await req.usuarioDb.inserir(usuarioData);
        res.status(201).json({ mensagem: 'Usuário criado com sucesso.', id: insertedId });
    } catch (error) {
        logErro(`Erro ao criar usuário: ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao criar usuário.', detalhe: error.message });
    }
});


app.get('/usuarios/:id',ensureAuthenticated, async (req, res) => {
    try {
        const usuario = await req.usuarioDb.buscarPorId(req.params.id);
        if (usuario) {
            const { senha, ...usuarioSemSenha } = usuario; 
            res.json(usuarioSemSenha);
        } else {
            res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        }
    } catch (error) {
        logErro(`Erro ao buscar usuário (ID: ${req.params.id}): ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao buscar usuário.', detalhe: error.message });
    }
});


app.get('/usuarios',ensureAuthenticated, async (req, res) => {
    try {
        const usuarios = await req.usuarioDb.buscarTodos();
        const usuariosSemSenhas = usuarios.map(usuario => {
            const { senha, ...rest } = usuario;
            return rest;
        });
        res.json(usuariosSemSenhas);
    } catch (error) {
        logErro(`Erro ao buscar todos os usuários: ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao buscar usuários.', detalhe: error.message });
    }
});


app.put('/usuarios/:id',ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const dadosParaAtualizar = req.body;

        if (dadosParaAtualizar._id) { delete dadosParaAtualizar._id; } 

        if (Object.keys(dadosParaAtualizar).length === 0) {
            return res.status(400).json({ mensagem: 'Nenhum dado fornecido para atualização.' });
        }

        const modifiedCount = await req.usuarioDb.atualizar(id, dadosParaAtualizar);

        if (modifiedCount === 1) {
            res.json({ mensagem: 'Usuário atualizado com sucesso.' });
        } else if (modifiedCount === 0) {
            res.status(404).json({ mensagem: 'Usuário não encontrado ou nenhum dado foi alterado.' });
        } else {
            res.status(500).json({ mensagem: 'Erro desconhecido na atualização do usuário.' });
        }
    } catch (error) {
        logErro(`Erro ao atualizar usuário (ID: ${req.params.id}): ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao atualizar usuário.', detalhe: error.message });
    }
});


app.delete('/usuarios/:id',ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCount = await req.usuarioDb.deletar(id);
        if (deletedCount === 1) {
            res.json({ mensagem: 'Usuário deletado com sucesso.' });
        } else {
            res.status(404).json({ mensagem: 'Usuário não encontrado para deletar.' });
        }
    } catch (error) {
        logErro(`Erro ao deletar usuário (ID: ${req.params.id}): ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao deletar usuário.', detalhe: error.message });
    }
});


app.post('/eventos',ensureAuthenticated,async (req, res) => {
    try {
        const { titulo, data, descricao, idUsuario, idCategoria } = req.body;
        if (!titulo || !data || !idUsuario) { 
            logErro('Evento.inserir: Campos obrigatórios faltando (titulo, data, idUsuario).');
            return res.status(400).json({ mensagem: 'Título, data e ID do usuário são obrigatórios para o evento.' });
        }
        const eventoData = {
            titulo,
            data: new Date(data),
            descricao,
            idUsuario,
            idCategoria
        };
        const insertedId = await req.eventoDb.inserir(eventoData);
        res.status(201).json({ mensagem: 'Evento criado com sucesso.', id: insertedId });
    } catch (error) {
        logErro(`Erro ao criar evento: ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao criar evento.', detalhe: error.message });
    }
});

app.get('/eventos/:id',ensureAuthenticated, async (req, res) => {
    try {
        const evento = await req.eventoDb.buscarPorId(req.params.id);
        if (evento) {
            res.json(evento);
        } else {
            res.status(404).json({ mensagem: 'Evento não encontrado.' });
        }
    } catch (error) {
        logErro(`Erro ao buscar evento (ID: ${req.params.id}): ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao buscar evento.', detalhe: error.message });
    }
});

app.get('/eventos',ensureAuthenticated, async (req, res) => {
    try {
        const eventos = await req.eventoDb.buscarTodos();
        res.json(eventos);
    } catch (error) {
        logErro(`Erro ao buscar todos os eventos: ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao buscar eventos.', detalhe: error.message });
    }
});

app.put('/eventos/:id', ensureAuthenticated,async (req, res) => {
    try {
        const { id } = req.params;
        const dadosParaAtualizar = req.body;

        if (dadosParaAtualizar._id) { delete dadosParaAtualizar._id; }

        if (dadosParaAtualizar.data) {
            dadosParaAtualizar.data = new Date(dadosParaAtualizar.data);
        }

        if (Object.keys(dadosParaAtualizar).length === 0) {
            return res.status(400).json({ mensagem: 'Nenhum dado fornecido para atualização.' });
        }

        const modifiedCount = await req.eventoDb.atualizar(id, dadosParaAtualizar);

        if (modifiedCount === 1) {
            res.json({ mensagem: 'Evento atualizado com sucesso.' });
        } else if (modifiedCount === 0) {
            res.status(404).json({ mensagem: 'Evento não encontrado ou nenhum dado foi alterado.' });
        } else {
            res.status(500).json({ mensagem: 'Erro desconhecido na atualização do evento.' });
        }
    } catch (error) {
        logErro(`Erro ao atualizar evento (ID: ${req.params.id}): ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao atualizar evento.', detalhe: error.message });
    }
});

app.delete('/eventos/:id', ensureAuthenticated,async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCount = await req.eventoDb.deletar(id);
        if (deletedCount === 1) {
            res.json({ mensagem: 'Evento deletado com sucesso.' });
        } else {
            res.status(404).json({ mensagem: 'Evento não encontrado para deletar.' });
        }
    } catch (error) {
        logErro(`Erro ao deletar evento (ID: ${req.params.id}): ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao deletar evento.', detalhe: error.message });
    }
});


app.post('/categorias',ensureAuthenticated, async (req, res) => {
    try {
        const { nome, cor } = req.body;
        if (!nome) {
            logErro('Categoria.inserir: Campo obrigatório faltando (nome).');
            return res.status(400).json({ mensagem: 'Nome da categoria é obrigatório.' });
        }
        const categoriaData = { nome, cor };
        const insertedId = await req.categoriaDb.inserir(categoriaData);
        res.status(201).json({ mensagem: 'Categoria criada com sucesso.', id: insertedId });
    } catch (error) {
        logErro(`Erro ao criar categoria: ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao criar categoria.', detalhe: error.message });
    }
});


app.get('/categorias/:id',ensureAuthenticated, async (req, res) => {
    try {
        const categoria = await req.categoriaDb.buscarPorId(req.params.id);
        if (categoria) {
            res.json(categoria);
        } else {
            res.status(404).json({ mensagem: 'Categoria não encontrada.' });
        }
    } catch (error) {
        logErro(`Erro ao buscar categoria (ID: ${req.params.id}): ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao buscar categoria.', detalhe: error.message });
    }
});


app.get('/categorias',ensureAuthenticated, async (req, res) => {
    try {
        const categorias = await req.categoriaDb.buscarTodos(); 
        res.json(categorias);
    } catch (error) {
        logErro(`Erro ao buscar todas as categorias: ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao buscar categorias.', detalhe: error.message });
    }
});


app.put('/categorias/:id',ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const dadosParaAtualizar = req.body;

        if (dadosParaAtualizar._id) { delete dadosParaAtualizar._id; }

        if (Object.keys(dadosParaAtualizar).length === 0) {
            return res.status(400).json({ mensagem: 'Nenhum dado fornecido para atualização.' });
        }

        const modifiedCount = await req.categoriaDb.atualizar(id, dadosParaAtualizar);

        if (modifiedCount === 1) {
            res.json({ mensagem: 'Categoria atualizada com sucesso.' });
        } else if (modifiedCount === 0) {
            res.status(404).json({ mensagem: 'Categoria não encontrada ou nenhum dado foi alterado.' });
        } else {
            res.status(500).json({ mensagem: 'Erro desconhecido na atualização da categoria.' });
        }
    } catch (error) {
        logErro(`Erro ao atualizar categoria (ID: ${req.params.id}): ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao atualizar categoria.', detalhe: error.message });
    }
});


app.delete('/categorias/:id',ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCount = await req.categoriaDb.deletar(id);
        if (deletedCount === 1) {
            res.json({ mensagem: 'Categoria deletada com sucesso.' });
        } else {
            res.status(404).json({ mensagem: 'Categoria não encontrada para deletar.' });
        }
    } catch (error) {
        logErro(`Erro ao deletar categoria (ID: ${req.params.id}): ${error.message}`);
        res.status(500).json({ mensagem: 'Erro ao deletar categoria.', detalhe: error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            logErro('Login: Email e senha são obrigatórios.');
            return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });
        }

        
        const usuario = await req.usuarioDb.buscar({ email: email }); 

        if (!usuario) {
            logErro(`Login: Tentativa de login com email não encontrado: ${email}`);
            return res.status(401).json({ mensagem: 'Credenciais inválidas (email não encontrado).' });
        }

        
        if (usuario.senha !== senha) { 
            logErro(`Login: Tentativa de login com senha incorreta para o email: ${email}`);
            return res.status(401).json({ mensagem: 'Credenciais inválidas (senha incorreta).' });
        }

        
        req.session.userId = usuario._id.toString(); 
        req.session.userEmail = usuario.email;       
        req.session.isAuthenticated = true;          

        logErro(`Login bem-sucedido para o usuário: ${usuario.email}`);
        res.status(200).json({ mensagem: 'Login bem-sucedido!', usuario: { id: usuario._id, email: usuario.email, nome: usuario.nome } });

    } catch (error) {
        logErro(`Erro no processo de login: ${error.message}`);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao tentar fazer login.', detalhe: error.message });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            logErro(`Erro ao fazer logout: ${err.message}`);
            return res.status(500).json({ mensagem: 'Erro ao fazer logout.' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ mensagem: 'Logout bem-sucedido.' });
    });
});
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(`Conectado ao DB: agenda`); 
});