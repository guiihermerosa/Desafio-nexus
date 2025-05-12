fetch('/user')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      document.getElementById('username').innerText = data.name;
    } else {
      console.error("Erro ao buscar o nome do usuário.");
    }
  })
  .catch(error => {
    console.error('Erro ao fazer requisição:', error);
  });

const buttondrop = document.getElementById('buttondrop');
const dropdownContent = document.querySelector('.dropdown-content');

buttondrop.addEventListener('click', () => {
  dropdownContent.classList.toggle('show');
});

window.addEventListener('click', function(event) {
  if (!event.target.matches('.dropbtn') && !event.target.matches('.dropdown-content') && !event.target.matches('.dropdown-content a')) {
    dropdownContent.classList.remove('show');
  }
});

async function fetchCoinsWithIcons() {
  const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1");
  const coins = await res.json();
  const container = document.getElementById("crypto-list");

  container.innerHTML = "";
  coins.forEach(coin => {
    const div = document.createElement("label");
    div.className = "crypto-item";
    div.innerHTML = `
      <span class="favorite-star" data-id="${coin.id}" data-symbol="${coin.symbol}" style="margin-left:auto;cursor:pointer;">☆</span>
      <input type="checkbox" value="${coin.id}" />
      <img src="${coin.image}" alt="${coin.name}" />
      ${coin.name} (${coin.symbol.toUpperCase()})
    `;
    container.appendChild(div);
  });

  document.querySelectorAll(".favorite-star").forEach(star => {
    star.addEventListener("click", async () => {
      const cryptoId = star.getAttribute("data-id");
      const cryptoSymbol = star.getAttribute("data-symbol");
      
      // Alterna o ícone da estrela
      star.textContent = star.textContent === "★" ? "☆" : "★";
      
      fetch("/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cryptoId, cryptoSymbol }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log("Favorito adicionado com sucesso!");
          } else {
            console.error("Erro ao adicionar favorito:", data.message);
          }
        })
        .catch(error => console.error("Erro ao fazer requisição:", error));
    });
  });
}

async function carregarFavoritasDoUsuario() {
  try {
    const response = await fetch('/favorites');
    const resultado = await response.json();

    if (!resultado.success) return;

    const ids = resultado.data.map(m => m.crypto_id);
    if (ids.length === 0) return;

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=brl`;
    const dados = await (await fetch(url)).json();

    const lista = document.getElementById('favorites-list');
    lista.innerHTML = '';

    resultado.data.forEach(crypto => {
      const preco = dados[crypto.crypto_id]?.brl?.toLocaleString('pt-BR', {
        style: 'currency', currency: 'BRL'
      }) || 'N/A';

      const li = document.createElement('li');
      li.innerHTML = `<strong>${crypto.crypto_symbol.toUpperCase()}</strong>: ${preco}`;
      lista.appendChild(li);
    });
  } catch (err) {
    console.error('Erro ao carregar favoritas:', err);
  }
}

carregarFavoritasDoUsuario();
setInterval(carregarFavoritasDoUsuario, 60000); // Atualiza a cada 1 minuto

async function convertSelected() {
  const amount = parseFloat(document.getElementById("amount").value);
  const checkboxes = document.querySelectorAll("#crypto-list input[type='checkbox']:checked");
  const selectedIds = Array.from(checkboxes).map(cb => cb.value);
  const resultBox = document.getElementById("results");
  resultBox.innerHTML = "";

  if (!amount || isNaN(amount)) {
    return resultBox.innerHTML = "<strong>Digite um valor válido.</strong>";
  }

  if (selectedIds.length === 0) {
    return resultBox.innerHTML = "<strong>Selecione ao menos uma criptomoeda.</strong>";
  }

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${selectedIds.join(",")}&vs_currencies=usd,brl`;
  const res = await fetch(url);
  const data = await res.json();

  for (const id of selectedIds) {
    const usd = data[id]?.usd ?? 0;
    const brl = data[id]?.brl ?? 0;

    const convertedUSD = (amount * usd).toFixed(2);
    const convertedBRL = (amount * brl).toFixed(2);

    // Mostrar na tela
    const div = document.createElement("div");
    div.innerHTML = `<strong>${id}</strong>: $${convertedUSD} USD | R$${convertedBRL} BRL`;
    resultBox.appendChild(div);

    // Salvar no banco (ex: versão em USD)
    await fetch("/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        crypto_name: id,
        crypto_price: convertedUSD,
        converted_to: "USD"
      })
    });
  }
}

document.getElementById("convert-btn").addEventListener("click", convertSelected);
fetchCoinsWithIcons();

document.addEventListener("DOMContentLoaded", async () => {
  const ctx = document.getElementById('cryptoChart').getContext('2d');

  const fetchPrices = async (coinId) => {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7`);
    const data = await res.json();
    return data.prices.map(p => ({
      time: new Date(p[0]).toLocaleDateString(),
      price: p[1]
    }));
  };

  const [btcData, ethData] = await Promise.all([
    fetchPrices("bitcoin"),
    fetchPrices("ethereum")
  ]);

  const labels = btcData.map(p => p.time); // Datas

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Bitcoin (BTC)',
          data: btcData.map(p => p.price),
          borderColor: 'orange',
          fill: false
        },
        {
          label: 'Ethereum (ETH)',
          data: ethData.map(p => p.price),
          borderColor: 'purple',
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Variação de preço - Últimos 7 dias'
        }
      },
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
});
