// db.js
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",    
  user: "root",
  password: "2341",
  database: "desafios_nexus",
  port: 3306,           
});

connection.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
    return;
  }
  console.log("Conectado ao banco de dados MySQL!");
});

module.exports = connection;
