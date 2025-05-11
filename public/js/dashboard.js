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
      <span class="favorite-star" data-id="${coin.name}" data-symbol="${coin.image}" style="margin-left:auto;cursor:pointer;">☆</span>
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
     

      star.textContent = star.textContent === "★" ? "☆" : "★";
    });
  });
}

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
