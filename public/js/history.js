// Função para carregar o histórico de conversões
 // Função para carregar o histórico de conversões
 fetch('/history')
 .then(response => response.json())
 .then(data => {
     const tableBody = document.querySelector("#historyTable tbody");
     const historyData = data.history; // Pega a lista de conversões do JSON

     // Preenche a tabela com os dados
     historyData.forEach(item => {
         // Formata a data para um formato legível
         const date = new Date(item.date);
         const formattedDate = date.toLocaleString('pt-BR', {
             day: '2-digit',
             month: '2-digit',
             year: 'numeric',
             hour: '2-digit',
             minute: '2-digit',
             second: '2-digit'
         });

         // Cria uma nova linha para cada item no histórico
         const row = document.createElement("tr");

         // Cria células para cada coluna
         row.innerHTML = `
             <td>${item.crypto_name}</td>
             <td>R$ ${item.crypto_price.toFixed(2)}</td>
             <td>${item.converted_to}</td>
             <td>${formattedDate}</td>
         `;

         // Adiciona a linha à tabela
         tableBody.appendChild(row);
     });
 })
 .catch(error => {
     console.error('Erro ao carregar o histórico:', error);
 });