const express = require("express");
const path = require("path");
const session = require("express-session");
const db = require("./db");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessão para controle de login
app.use(session({
  secret: "Admin1234", 
  resave: false,
  saveUninitialized: false
}));

// Middleware de autenticação
function authMiddleware(req, res, next) {
  if (req.session.userId) {
    next(); 
  } else {
    res.redirect("/index.html"); 
  }
}

app.use(express.static(path.join(__dirname, "public")));

// Rota de login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ?";
  try {
    const [results] = await db.query(query, [username]);
    if (results.length === 0) {
      console.log("Usuário não encontrado.");
      return res.json({ success: false, message: "Usuário não encontrado." });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("Senha incorreta.");
      return res.json({ success: false, message: "Senha incorreta." });
    }

    req.session.userId = user.id;
    console.log("Login bem-sucedido");
    res.json({ success: true });
  } catch (err) {
    console.error("Erro no servidor:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// Rota de registro
app.post("/register", async (req, res) => {
  const { name, email, username, password, birthdate } = req.body;

  const birth = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  if (age < 18 || (age === 18 && today < new Date(birth.setFullYear(today.getFullYear())))) {
    return res.json({ success: false, message: "Usuário deve ter mais de 18 anos." });
  }

  const checkQuery = "SELECT id FROM users WHERE username = ? OR email = ?";
  try {
    const [results] = await db.query(checkQuery, [username, email]);
    if (results.length > 0) {
      return res.json({ success: false, message: "Usuário ou email já cadastrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = "INSERT INTO users (name, email, username, password, birthdate) VALUES (?, ?, ?, ?, ?)";
    await db.query(insertQuery, [name, email, username, hashedPassword, birthdate]);

    res.json({ success: true });
  } catch (err) {
    console.error("Erro no servidor:", err);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

app.get("/user", authMiddleware, async (req, res) => {
  const userId = req.session.userId;

  // Buscar os dados do usuário no banco de dados
  const query = "SELECT name FROM users WHERE id = ?";
  try {
    const [results] = await db.query(query, [userId]);
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado." });
    }

    const user = results[0];
    res.json({ success: true, name: user.name });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

app.post('/favorites', async (req, res) => {
  const { cryptoId, cryptoSymbol } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }

  const checkQuery = 'SELECT * FROM favorites WHERE user_id = ? AND crypto_id = ?';
  try {
    const [results] = await db.query(checkQuery, [userId, cryptoId]);
    if (results.length > 0) {
      return res.json({ success: false, message: 'Já está como favorito' });
    }

    const insertQuery = 'INSERT INTO favorites (user_id, crypto_id, crypto_symbol) VALUES (?, ?, ?)';
    await db.query(insertQuery, [userId, cryptoId, cryptoSymbol]);

    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao verificar ou inserir favorito:', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

app.get('/favorites', async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }

  try {
    const [favoritas] = await db.query(
      'SELECT crypto_id, crypto_symbol FROM favorites WHERE user_id = ?',
      [userId]
    );

    res.json({ success: true, data: favoritas });
  } catch (error) {
    console.error('Erro ao buscar favoritas:', error);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

app.get("/dashboard", authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "protected", "dashboard.html"));
});

app.post("/convert", authMiddleware, async (req, res) => {
  const user_id = req.session.userId;
  const { crypto_name, crypto_price, converted_to = "USD" } = req.body;

  if (!user_id || !crypto_name || !crypto_price) {
    return res.status(400).json({ success: false, message: "Dados incompletos." });
  }

  const query = `
    INSERT INTO conversion_history (user_id, crypto_name, crypto_price, converted_to)
    VALUES (?, ?, ?, ?)
  `;

  try {
    await db.query(query, [user_id, crypto_name, crypto_price, converted_to]);
    res.json({ success: true, message: "Conversão salva com sucesso." });
  } catch (err) {
    console.error("Erro ao salvar conversão:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

app.get('/history', authMiddleware, async (req, res) => {
  const userId = req.session.userId;

  const query = `
    SELECT crypto_name, crypto_price, converted_to, date
    FROM conversion_history
    WHERE user_id = ?
    ORDER BY date DESC
  `;

  try {
    const [results] = await db.query(query, [userId]);
    console.log('Histórico de conversões:', results);
    res.json({ history: results });
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    return res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// Inicialização do servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
