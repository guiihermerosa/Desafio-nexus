// setupDB.js
const db = require("./db"); 
const createUsersTable = `
 CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  username VARCHAR(50) UNIQUE,
  password VARCHAR(100),
  birthdate DATE
);

`;
const createConversionHistoryTable = `
CREATE TABLE IF NOT EXISTS conversion_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  crypto_name TEXT NOT NULL,
  crypto_price REAL NOT NULL,
  converted_to TEXT DEFAULT 'USD',
  date TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);  
`;


  const createFavoritesTableForeignKey = `
  CREATE TABLE  IF NOT EXISTS favorites (
  id INT PRIMARY KEY AUTOINCREMENT,
  crypto_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
 `;

 db.query(createConversionHistoryTable, (err, result) => {
  if (err) {
    console.error("Erro ao criar tabela:", err);
    return;
  }
  console.log("Tabela 'conversion_history' criada ou já existe.");
  });

db.query(createFavoritesTableForeignKey, (err, result) => {
    if (err) {
      console.error("Erro ao criar tabela:", err);
      return;
    }
    console.log("Tabela 'conversion_history' criada ou já existe.");
  });

db.query(createUsersTable, (err, result) => {
  if (err) {
    console.error("Erro ao criar tabela:", err);
    return;
  }
  console.log("Tabela 'users' criada ou já existe.");
    db.end(); 
  });


