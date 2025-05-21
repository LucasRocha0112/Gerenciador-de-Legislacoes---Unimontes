const express = require("express");
const mysql = require("mysql2/promise"); // Usando a versão com promises
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Inicializar o app
const app = express();
const PORT = 3000;

// Configurações
const uploadDir = path.join(__dirname, "uploads");

// Configuração CORS para desenvolvimento
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Admin-Token']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

// Verificar ou criar a pasta 'uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB
});

// Configurar pool de conexões com o banco de dados
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "sistema_unimontes",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware de verificação de admin
async function verificarAdmin(req, res, next) {
  const authToken = req.headers['admin-token'] || req.headers['Admin-Token'];
  
  // Em desenvolvimento, aceita qualquer token ou o padrão 'admin123'
  if (process.env.NODE_ENV === 'development' || authToken === 'admin123') {
    return next();
  }
  
  console.log("Tentativa de acesso não autorizado. Token recebido:", authToken);
  res.status(403).json({
    success: false,
    message: "Acesso negado - faça login como administrador"
  });
}

// Rota de login
app.post('/login', (req, res) => {
  try {
    const { usuario, senha } = req.body;

    if (usuario === "admin" && senha === "admin123") {
      res.json({
        success: true,
        message: "Login bem-sucedido",
        token: "admin123"
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Credenciais inválidas"
      });
    }
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno no servidor"
    });
  }
});

// Rotas de cadastro protegidas
app.post("/cadastrar-resolucao", verificarAdmin, upload.single("pdf"), async (req, res) => {
  try {
    // Extrai os dados do corpo da requisição (FormData)
    const { numero, tipo, ano, assunto, data, status, vinculo, vinculo_resolucao } = req.body;

    // Validação dos campos obrigatórios
    if (!numero || !tipo || !ano || !assunto || !data || !status || !vinculo) {
      return res.status(400).json({ 
        success: false, 
        message: "Todos os campos obrigatórios devem ser preenchidos." 
      });
    }

    const query = `
      INSERT INTO resolucoes 
        (numero, tipo, ano, assunto, data, status, vinculo, vinculo_resolucao, pdf)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      numero,
      tipo,
      ano,
      assunto,
      data,
      status,
      vinculo,
      vinculo === "Sim" ? vinculo_resolucao : null,
      req.file ? req.file.filename : null
    ];

    const [result] = await pool.execute(query, params);
    
    res.status(201).json({
      success: true,
      message: "Resolução cadastrada com sucesso.",
      id: result.insertId
    });
  } catch (error) {
    console.error("Erro no cadastro de resolução:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno no servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.post("/cadastrar-portaria", verificarAdmin, upload.single("pdfPortaria"), async (req, res) => {
  try {
    const { numeroPortaria, anoPortaria, assuntoPortaria, dataPortaria, statusPortaria } = req.body;

    if (!numeroPortaria || !anoPortaria || !assuntoPortaria || !dataPortaria || !statusPortaria) {
      return res.status(400).json({ 
        success: false, 
        message: "Todos os campos obrigatórios devem ser preenchidos." 
      });
    }

    const query = `
      INSERT INTO portarias (numero, ano, assunto, data, status, pdf)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      numeroPortaria,
      anoPortaria,
      assuntoPortaria,
      dataPortaria,
      statusPortaria,
      req.file ? req.file.filename : null,
    ];

    const [result] = await pool.execute(query, params);
    
    res.status(201).json({
      success: true,
      message: "Portaria cadastrada com sucesso.",
      id: result.insertId
    });
  } catch (error) {
    console.error("Erro no cadastro de portaria:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno no servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rotas de consulta públicas
app.get("/resolucoes", async (req, res) => {
  try {
    const { numero, ano, tipo, status, assunto } = req.query;

    let query = `
      SELECT id, numero, tipo, ano, assunto, data, status, vinculo, vinculo_resolucao, pdf
      FROM resolucoes WHERE 1=1
    `;
    const params = [];

    if (numero) query += " AND numero LIKE ?", params.push(`%${numero}%`);
    if (ano) query += " AND ano = ?", params.push(ano);
    if (tipo) query += " AND tipo = ?", params.push(tipo);
    if (status) query += " AND status = ?", params.push(status);
    if (assunto) query += " AND assunto LIKE ?", params.push(`%${assunto}%`);

    const [results] = await pool.execute(query, params);
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Erro ao pesquisar resoluções:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno no servidor"
    });
  }
});

app.get("/portarias", async (req, res) => {
  try {
    const { numero, ano, status, assunto } = req.query;

    let query = `
      SELECT id, numero, ano, assunto, data, status, pdf
      FROM portarias WHERE 1=1
    `;
    const params = [];

    if (numero) query += " AND numero LIKE ?", params.push(`%${numero}%`);
    if (ano) query += " AND ano = ?", params.push(ano);
    if (status) query += " AND status = ?", params.push(status);
    if (assunto) query += " AND assunto LIKE ?", params.push(`%${assunto}%`);

    const [results] = await pool.execute(query, params);
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Erro ao pesquisar portarias:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno no servidor"
    });
  }
});

// Rotas de exclusão protegidas
app.delete("/resolucoes/:id", verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await pool.execute("SELECT pdf FROM resolucoes WHERE id = ?", [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Resolução não encontrada." });
    }

    const pdfPath = results[0].pdf ? path.join(uploadDir, results[0].pdf) : null;

    const [result] = await pool.execute("DELETE FROM resolucoes WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Resolução não encontrada." });
    }

    if (pdfPath && fs.existsSync(pdfPath)) {
      fs.unlink(pdfPath, (err) => {
        if (err) console.error("Erro ao excluir arquivo PDF:", err);
      });
    }

    res.json({ success: true, message: "Resolução excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir resolução:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno no servidor"
    });
  }
});

app.delete("/portarias/:id", verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await pool.execute("SELECT pdf FROM portarias WHERE id = ?", [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Portaria não encontrada." });
    }

    const pdfPath = results[0].pdf ? path.join(uploadDir, results[0].pdf) : null;

    const [result] = await pool.execute("DELETE FROM portarias WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Portaria não encontrada." });
    }

    if (pdfPath && fs.existsSync(pdfPath)) {
      fs.unlink(pdfPath, (err) => {
        if (err) console.error("Erro ao excluir arquivo PDF:", err);
      });
    }

    res.json({ success: true, message: "Portaria excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir portaria:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno no servidor"
    });
  }
});

// Rota de teste
app.get("/", (req, res) => {
  res.json({
    message: "API do Sistema de Legislações Unimontes",
    status: "online",
    timestamp: new Date()
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno no servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

