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
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error("Erro no servidor:", err);
      return res.status(500).json({ success: false, message: "Erro no servidor." });
    }
    if (results.length === 0) {
      console.log("Usuário não encontrado.");
      return res.json({ success: false, message: "Usuário não encontrado." });
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) {
        console.error("Erro ao comparar senha:", err);
        return res.status(500).json({ success: false });
      }
      if (!match) {
        console.log("Senha incorreta.");
        return res.json({ success: false, message: "Senha incorreta." });
      }

      req.session.userId = user.id;
      console.log("Login bem-sucedido");
      res.json({ success: true });
    });
  });
});

// Rota de registro
app.post("/register", (req, res) => {
  const { name, email, username, password, birthdate } = req.body;

  const birth = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  if (age < 18 || (age === 18 && today < new Date(birth.setFullYear(today.getFullYear())))) {
    return res.json({ success: false, message: "Usuário deve ter mais de 18 anos." });
  }

  const checkQuery = "SELECT id FROM users WHERE username = ? OR email = ?";
  db.query(checkQuery, [username, email], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Erro no servidor." });

    if (results.length > 0) {
      return res.json({ success: false, message: "Usuário ou email já cadastrado." });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ success: false, message: "Erro ao criptografar senha." });

      const insertQuery = "INSERT INTO users (name, email, username, password, birthdate) VALUES (?, ?, ?, ?, ?)";
      db.query(insertQuery, [name, email, username, hashedPassword, birthdate], (err) => {
        if (err) return res.status(500).json({ success: false, message: "Erro ao cadastrar." });

        res.json({ success: true });
      });
    });
  });
});

app.get("/user", authMiddleware, (req, res) => {
  const userId = req.session.userId;

  // Buscar os dados do usuário no banco de dados
  const query = "SELECT name FROM users WHERE id = ?";
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Erro no servidor." });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado." });
    }

    const user = results[0];
    res.json({ success: true, name: user.name });
  });
});

app.post("/favorites", authMiddleware, (req, res) => {
  const userId = req.session.userId;
  const { cryptoId } = req.body;
  const { cryptoSymbol } = req.body;
   //enviando para o banco de dados
  const query = "INSERT INTO favorites (user_id, crypto_id, symbol) VALUES (?, ?, ?)";
  db.query(query, [userId, cryptoId, cryptoSymbol], (err) => {
    
    if (err) {
      console.error("Erro ao adicionar favorito:", err);
      return res.status(500).json({ success: false, message: "Erro ao adicionar favorito." });
    }
    console.log("Favorito adicionado com sucesso!");
    res.json({ success: true }); 
  });
 });


app.get("/dashboard", authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "protected", "dashboard.html"));
});

app.post("/convert", authMiddleware, (req, res) => {
  console.log("Sessão atual:", req.session);
  const user_id = req.session.userId;

  const { crypto_name, crypto_price, converted_to = "USD" } = req.body;

  if (!user_id || !crypto_name || !crypto_price) {
    return res.status(400).json({ success: false, message: "Dados incompletos." });
  }

  const query = `
    INSERT INTO conversion_history (user_id, crypto_name, crypto_price, converted_to)
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [user_id, crypto_name, crypto_price, converted_to], (err) => {
    if (err) {
      console.error("Erro ao salvar conversão:", err);
      return res.status(500).json({ success: false, message: "Erro no servidor." });
    }

    res.json({ success: true, message: "Conversão salva com sucesso." });
  });
});
app.get('/history', authMiddleware, (req, res) => {
  const userId = req.session.userId;

  const query = `
    SELECT crypto_name, crypto_price, converted_to, date
    FROM conversion_history
    WHERE user_id = ?
    ORDER BY date DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar histórico:', err);
      return res.status(500).json({ error: 'Erro ao buscar histórico' });
    }

    res.json({ history: results });
  });
});

// Inicialização do servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
