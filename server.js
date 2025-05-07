const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Inicializar o app
const app = express();
const PORT = 3000;

// Configurações
const uploadDir = path.join(__dirname, "uploads");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

// Verificar ou criar a pasta 'uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Configurar conexão com o banco de dados
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "sistema_unimontes"
});

// Verificar conexão com o banco
db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
    return;
  }
  console.log("Conectado ao banco de dados sistema_unimontes");
});

// Middleware de verificação de admin
function verificarAdmin(req, res, next) {
  const authToken = req.headers['admin-token'];

  if (authToken === 'admin123') {
    next();
  } else {
    console.log("Tentativa de acesso não autorizado. Token recebido:", authToken);
    res.status(403).json({
      success: false,
      message: "Acesso negado - faça login como administrador"
    });
  }
}

// Rota de login
app.post('/login', (req, res) => {
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
});

// Rotas de cadastro protegidas
app.post("/cadastrar-resolucao", verificarAdmin, upload.single("pdf"), (req, res) => {
  const { numero, tipo, ano, assunto, data, status, vinculo, vinculo_resolucao } = req.body;

  if (!numero || !tipo || !ano || !assunto || !data || !status || !vinculo) {
    return res.status(400).json({ success: false, message: "Todos os campos obrigatórios devem ser preenchidos." });
  }

  const query = `
    INSERT INTO resolucoes (numero, tipo, ano, assunto, data, status, vinculo, vinculo_resolucao, pdf)
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
    req.file ? req.file.filename : null,
  ];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao cadastrar resolução:", err.message);
      return res.status(500).json({ success: false, message: "Erro ao cadastrar resolução." });
    }
    res.status(201).json({
      success: true,
      message: "Resolução cadastrada com sucesso.",
      id: result.insertId
    });
  });
});

app.post("/cadastrar-portaria", verificarAdmin, upload.single("pdfPortaria"), (req, res) => {
  const { numeroPortaria, anoPortaria, assuntoPortaria, dataPortaria, statusPortaria } = req.body;

  if (!numeroPortaria || !anoPortaria || !assuntoPortaria || !dataPortaria || !statusPortaria) {
    return res.status(400).json({ success: false, message: "Todos os campos obrigatórios devem ser preenchidos." });
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

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao cadastrar portaria:", err.message);
      return res.status(500).json({ success: false, message: "Erro ao cadastrar portaria." });
    }
    res.status(201).json({
      success: true,
      message: "Portaria cadastrada com sucesso.",
      id: result.insertId
    });
  });
});

// Rotas de consulta públicas
app.get("/resolucoes", (req, res) => {
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

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Erro ao pesquisar resoluções:", err);
      return res.status(500).json({ success: false, message: "Erro ao pesquisar resoluções." });
    }
    res.json({ success: true, data: results });
  });
});

app.get("/portarias", (req, res) => {
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

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Erro ao pesquisar portarias:", err);
      return res.status(500).json({ success: false, message: "Erro ao pesquisar portarias." });
    }
    res.json({ success: true, data: results });
  });
});

// Rotas de exclusão protegidas
app.delete("/resolucoes/:id", verificarAdmin, (req, res) => {
  const { id } = req.params;

  db.query("SELECT pdf FROM resolucoes WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar resolução:", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar resolução." });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Resolução não encontrada." });
    }

    const pdfPath = results[0].pdf ? path.join(uploadDir, results[0].pdf) : null;

    db.query("DELETE FROM resolucoes WHERE id = ?", [id], (err, result) => {
      if (err) {
        console.error("Erro ao excluir resolução:", err);
        return res.status(500).json({ success: false, message: "Erro ao excluir resolução." });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Resolução não encontrada." });
      }

      if (pdfPath && fs.existsSync(pdfPath)) {
        fs.unlink(pdfPath, (err) => {
          if (err) console.error("Erro ao excluir arquivo PDF:", err);
        });
      }

      res.json({ success: true, message: "Resolução excluída com sucesso." });
    });
  });
});

app.delete("/portarias/:id", verificarAdmin, (req, res) => {
  const { id } = req.params;

  db.query("SELECT pdf FROM portarias WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar portaria:", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar portaria." });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Portaria não encontrada." });
    }

    const pdfPath = results[0].pdf ? path.join(uploadDir, results[0].pdf) : null;

    db.query("DELETE FROM portarias WHERE id = ?", [id], (err, result) => {
      if (err) {
        console.error("Erro ao excluir portaria:", err);
        return res.status(500).json({ success: false, message: "Erro ao excluir portaria." });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Portaria não encontrada." });
      }

      if (pdfPath && fs.existsSync(pdfPath)) {
        fs.unlink(pdfPath, (err) => {
          if (err) console.error("Erro ao excluir arquivo PDF:", err);
        });
      }

      res.json({ success: true, message: "Portaria excluída com sucesso." });
    });
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});