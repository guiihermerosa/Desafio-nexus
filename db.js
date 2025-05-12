const mysql = require("mysql2/promise");

const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "2341",
  database: "desafios_nexus",
  port: 3306,  // Certifique-se de que o MySQL está usando esta porta.
});

connection.getConnection()
  .then(() => console.log("Conectado ao banco de dados MySQL!"))
  .catch(err => console.error("Erro ao conectar ao banco de dados:", err));

module.exports = connection;
