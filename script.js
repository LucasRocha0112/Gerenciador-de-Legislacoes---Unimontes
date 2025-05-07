const API_URL = "http://localhost:3000";


let isAdminLoggedIn = false;

// Função para obter headers de autenticação
function getAuthHeaders() {
  return {
    'Admin-Token': localStorage.getItem('adminToken') || ''
  };
}



// Funções de Login/Logout
function mostrarLogin() {
  document.getElementById('modalLogin').style.display = 'block';
}

function fecharModal() {
  document.getElementById('modalLogin').style.display = 'none';
}



async function fazerLogin(event) {
  event.preventDefault();
  const usuario = document.getElementById('usuario').value;
  const senha = document.getElementById('senha').value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usuario, senha })
    });

    if (response.ok) {
      const data = await response.json();
      isAdminLoggedIn = true;
      localStorage.setItem('adminToken', data.token);
      document.getElementById('adminButtons').style.display = 'block';
      document.getElementById('btnLogin').innerHTML = '<i class="fas fa-user"></i> Logout';
      document.getElementById('btnLogin').onclick = logout;
      fecharModal();
    } else {
      const error = await response.json();
      alert(error.message || 'Erro no login');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao conectar com o servidor');
  }
}



function logout() {
  isAdminLoggedIn = false;
  localStorage.removeItem('adminToken');
  document.getElementById('adminButtons').style.display = 'none';
  document.getElementById('btnLogin').innerHTML = '<i class="fa-solid fa-user"></i>';
  document.getElementById('btnLogin').onclick = mostrarLogin;
  voltarPaginaInicial();
}



// Navegação entre telas
function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  Array.from(tabcontent).forEach((tab) => (tab.style.display = "none"));
  document.getElementById("telaInicial").style.display = "none";
  document.getElementById(tabName).style.display = "block";
  if (evt) evt.currentTarget.classList.add("active");
  if (tabName !== 'telaInicial') {
      document.getElementById('btnVoltarContainer').style.display = 'block';
  }
}

// Função principal para voltar
function voltar() {
  const currentTab = document.querySelector('.tabcontent[style*="display: block"]') || 
                    document.querySelector('.tabcontent:not([style*="display: none"])');
  
  if (!currentTab) return;
  
  if (currentTab.id === 'pesquisaResolucao' || currentTab.id === 'pesquisaPortaria') {
      document.getElementById('pesquisa').style.display = 'block';
      document.getElementById('pesquisaResolucao').style.display = 'none';
      document.getElementById('pesquisaPortaria').style.display = 'none';
      document.getElementById('resultadosPesquisaResolucao').style.display = 'none';
      document.getElementById('resultadosPesquisaPortaria').style.display = 'none';
  } 
  else if (currentTab.id === 'pesquisa') {
      voltarPaginaInicial();
  }
  else if (currentTab.id === 'cadastroResolucao' || currentTab.id === 'cadastroPortaria') {
      if (document.getElementById('opcoesCadastro').style.display === 'flex') {
          voltarPaginaInicial();
      } else {
          mostrarOpcoesCadastro();
      }
  }
  else {

      voltarPaginaInicial();
  }
  if (document.getElementById('telaInicial').style.display === 'flex') {
      document.getElementById('btnVoltarContainer').style.display = 'none';
  }
}

function voltarPaginaInicial() {
  document.getElementById("telaInicial").style.display = "flex";
  const tabcontent = document.getElementsByClassName("tabcontent");
  Array.from(tabcontent).forEach((tab) => (tab.style.display = "none"));
  document.getElementById('btnVoltarContainer').style.display = 'none';
  document.getElementById('opcoesCadastro').style.display = 'none';
  document.querySelector(".button-container").style.display = "flex";
}



function openPesquisa() {
  document.getElementById("telaInicial").style.display = "none";
  document.getElementById("pesquisa").style.display = "block";
  document.getElementById('btnVoltarContainer').style.display = 'block';

  const tabcontent = document.getElementsByClassName("tabcontent");
  Array.from(tabcontent).forEach((tab) => {
      if (tab.id !== "pesquisa") {
          tab.style.display = "none";
      }
  });
}

function openPesquisaResolucao() {
  document.getElementById('pesquisa').style.display = 'none';
  document.getElementById('pesquisaResolucao').style.display = 'block';
}

function openPesquisaPortaria() {
  document.getElementById('pesquisa').style.display = 'none';
  document.getElementById('pesquisaPortaria').style.display = 'block';
}

function mostrarOpcoesCadastro() {
  document.querySelector(".button-container").style.display = "none";
  document.getElementById("opcoesCadastro").style.display = "flex";
  document.getElementById('btnVoltarContainer').style.display = 'block';
}



// Funções de cadastro
async function submitForm(event) {
  event.preventDefault();
  const formCadastro = document.getElementById("formCadastro");
  const formData = new FormData(formCadastro);

  try {
    const response = await fetch(`${API_URL}/cadastrar-resolucao`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    if (response.ok) {
      alert("Resolução cadastrada com sucesso!");
      formCadastro.reset();
      document.getElementById("file-name").textContent = "Nenhum arquivo selecionado";
    } else {
      const errorMessage = await response.text();
      alert(`Erro ao cadastrar: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Erro no cadastro:", error.message);
    alert("Erro ao se conectar ao servidor. Verifique a conexão.");
  }
}



async function submitFormPortaria(event) {
  event.preventDefault();
  const formCadastroPortaria = document.getElementById("formCadastroPortaria");
  const formData = new FormData(formCadastroPortaria);

  try {
    const response = await fetch(`${API_URL}/cadastrar-portaria`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    if (response.ok) {
      alert("Portaria cadastrada com sucesso!");
      formCadastroPortaria.reset();
      document.getElementById("file-name-portaria").textContent = "Nenhum arquivo selecionado";
    } else {
      const errorMessage = await response.text();
      alert(`Erro ao cadastrar: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Erro no cadastro:", error.message);
    alert("Erro ao se conectar ao servidor. Verifique a conexão.");
  }
}



// Funções de pesquisa
async function pesquisarResolucoes(event) {
  event.preventDefault();

  const numero = document.getElementById("numeroPesquisa").value.trim();
  const ano = document.getElementById("anoPesquisa").value.trim();
  const tipo = document.getElementById("tipoPesquisa").value.trim();
  const status = document.getElementById("statusPesquisaHidden").value; // Usar o valor do hidden input
  const assunto = document.getElementById("assuntoPesquisa").value.trim();

  const queryParams = new URLSearchParams();
  if (numero) queryParams.append("numero", numero);
  if (ano) queryParams.append("ano", ano);
  if (tipo) queryParams.append("tipo", tipo);
  if (status) queryParams.append("status", status);
  if (assunto) queryParams.append("assunto", assunto);

  try {
    const response = await fetch(`${API_URL}/resolucoes?${queryParams.toString()}`);
    
    if (!response.ok) {
      const errorMessage = await response.text();
      alert(`Erro na pesquisa: ${errorMessage}`);
      return;
    }
    
    const data = await response.json();
    
    const resolucoes = data.data || data;
    
    if (!resolucoes || resolucoes.length === 0) {
      alert("Nenhuma resolução encontrada com os critérios informados.");
      return;
    }
    
    exibirResultadosResolucoes(resolucoes);
    document.getElementById("resultadosPesquisaResolucao").style.display = "block";
    
  } catch (error) {
    console.error("Erro ao buscar resoluções:", error);
    alert("Erro ao se conectar ao servidor. Verifique a conexão.");
  }
}




async function pesquisarPortarias(event) {
  event.preventDefault();

  const numero = document.getElementById("numeroPesquisaPort").value.trim();
  const ano = document.getElementById("anoPesquisaPort").value.trim();
  const status = document.getElementById("statusPortariaPesquisaHidden").value; 
  const assunto = document.getElementById("assuntoPesquisaPort").value.trim();

  const queryParams = new URLSearchParams();
  if (numero) queryParams.append("numero", numero);
  if (ano) queryParams.append("ano", ano);
  if (status) queryParams.append("status", status);
  if (assunto) queryParams.append("assunto", assunto);

  try {
    const response = await fetch(`${API_URL}/portarias?${queryParams.toString()}`);
    
    if (!response.ok) {
      const errorMessage = await response.text();
      alert(`Erro na pesquisa: ${errorMessage}`);
      return;
    }
    
    const data = await response.json();
    
    const portarias = data.data || data;
    
    if (!portarias || portarias.length === 0) {
      alert("Nenhuma portaria encontrada com os critérios informados.");
      return;
    }
    
    exibirResultadosPortarias(portarias);
    document.getElementById("resultadosPesquisaPortaria").style.display = "block";
    
  } catch (error) {
    console.error("Erro ao buscar portarias:", error);
    alert("Erro ao se conectar ao servidor. Verifique a conexão.");
  }
}



// Exibir resultados
function exibirResultadosResolucoes(resolucoes) {
  const tabelaResultados = document.getElementById("tabelaResultadosResolucao").querySelector("tbody");
  tabelaResultados.innerHTML = "";

  if (!resolucoes || resolucoes.length === 0) {
    tabelaResultados.innerHTML = `
      <tr>
        <td colspan="8">Nenhuma resolução encontrada.</td>
      </tr>
    `;
    document.getElementById("resultadosPesquisaResolucao").style.display = "block";
    return;
  }

  resolucoes.forEach((resolucao) => {
    const dataFormatada = resolucao.data
      ? new Date(resolucao.data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      : "N/A";

    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${resolucao.numero}</td>
      <td>${resolucao.tipo}</td>
      <td>${resolucao.ano}</td>
      <td>${resolucao.assunto}</td>
      <td>${dataFormatada}</td>
      <td>${resolucao.status}</td>
      <td>${resolucao.vinculo_resolucao || "N/A"}</td>
      <td class="acoes-botoes">
        <button class="botao-acao visualizar" onclick="visualizarPDF('${resolucao.pdf}')">
          <i class="fa fa-file-pdf"></i>
        </button>
        ${isAdminLoggedIn ? `
        <button class="botao-acao excluir" onclick="excluirResolucao(${resolucao.id})">
          <i class="fa fa-trash"></i>
        </button>
        ` : ''}
      </td>
    `;
    tabelaResultados.appendChild(linha);
  });

  document.getElementById("resultadosPesquisaResolucao").style.display = "block";
}




function exibirResultadosPortarias(portarias) {
  const tabelaResultados = document.getElementById("tabelaResultadosPortaria").querySelector("tbody");
  tabelaResultados.innerHTML = "";

  if (!portarias || portarias.length === 0) {
    tabelaResultados.innerHTML = `
      <tr>
        <td colspan="6">Nenhuma portaria encontrada.</td>
      </tr>
    `;
    document.getElementById("resultadosPesquisaPortaria").style.display = "block";
    return;
  }

  portarias.forEach((portaria) => {
    const dataFormatada = portaria.data
      ? new Date(portaria.data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      : "N/A";

    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${portaria.numero}</td>
      <td>${portaria.ano}</td>
      <td>${portaria.assunto}</td>
      <td>${dataFormatada}</td>
      <td>${portaria.status}</td>
      <td class="acoes-botoes">
        <button class="botao-acao visualizar" onclick="visualizarPDF('${portaria.pdf}')">
          <i class="fa fa-file-pdf"></i>
        </button>
        ${isAdminLoggedIn ? `
        <button class="botao-acao excluir" onclick="excluirPortaria(${portaria.id})">
          <i class="fa fa-trash"></i>
        </button>
        ` : ''}
      </td>
    `;
    tabelaResultados.appendChild(linha);
  });

  document.getElementById("resultadosPesquisaPortaria").style.display = "block";
}




// Visualizar PDF
function visualizarPDF(pdfPath) {
  if (pdfPath) {
    const url = `${API_URL}/uploads/${pdfPath}`;
    window.open(url, "_blank");
  } else {
    alert("Nenhum PDF disponível para este documento.");
  }
}



// Funções de exclusão
async function excluirResolucao(id) {
  if (!isAdminLoggedIn) {
    alert("Apenas administradores podem excluir resoluções.");
    return;
  }

  if (confirm("Deseja realmente excluir esta resolução?")) {
    try {
      const response = await fetch(`${API_URL}/resolucoes/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        alert("Resolução excluída com sucesso!");
        document.getElementById("formPesquisaResolucao").dispatchEvent(new Event("submit"));
      } else {
        const errorMessage = await response.text();
        alert(`Erro ao excluir: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao se conectar ao servidor.");
    }
  }
}




async function excluirPortaria(id) {
  if (!isAdminLoggedIn) {
    alert("Apenas administradores podem excluir portarias.");
    return;
  }

  if (confirm("Deseja realmente excluir esta portaria?")) {
    try {
      const response = await fetch(`${API_URL}/portarias/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        alert("Portaria excluída com sucesso!");
        document.getElementById("formPesquisaPortaria").dispatchEvent(new Event("submit"));
      } else {
        const errorMessage = await response.text();
        alert(`Erro ao excluir: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao se conectar ao servidor.");
    }
  }
}



// Funções auxiliares
function toggleVinculo() {
  const vinculoSelect = document.getElementById("vinculo");
  const campoVinculo = document.getElementById("campoVinculo");

  if (vinculoSelect.value === "Sim") {
    campoVinculo.style.display = "block";
  } else {
    campoVinculo.style.display = "none";
  }
}

// Controle dos toggles nas pesquisas
document.getElementById('statusPesquisaToggle').addEventListener('change', function() {
  const value = this.checked ? 'Vigente' : 'Revogada';
  document.getElementById('statusPesquisaValue').textContent = value;
  document.getElementById('statusPesquisaHidden').value = value;
});

document.getElementById('statusPortariaPesquisaToggle').addEventListener('change', function() {
  const value = this.checked ? 'Vigente' : 'Revogada';
  document.getElementById('statusPortariaPesquisaValue').textContent = value;
  document.getElementById('statusPortariaPesquisaHidden').value = value;
});



function limparFormulario() {
  if (confirm("Tem certeza que deseja limpar todos os campos?")) {
      document.getElementById("formCadastro").reset();
      document.getElementById('statusToggle').checked = true;
      document.getElementById('statusValue').textContent = 'Vigente';
      document.getElementById('statusHidden').value = 'Vigente';
      
      document.getElementById('vinculoToggle').checked = true;
      document.getElementById('vinculoValue').textContent = 'Sim';
      document.getElementById('vinculoHidden').value = 'Sim';
      document.getElementById('campoVinculo').style.display = 'block';
      
      document.getElementById("file-name").textContent = "Nenhum arquivo selecionado";
  }
}

function limparFormularioPortaria() {
  if (confirm("Tem certeza que deseja limpar todos os campos?")) {
      document.getElementById("formCadastroPortaria").reset();
      document.getElementById('statusPortariaToggle').checked = true;
      document.getElementById('statusPortariaValue').textContent = 'Vigente';
      document.getElementById('statusPortariaHidden').value = 'Vigente';
      
      document.getElementById("file-name-portaria").textContent = "Nenhum arquivo selecionado";
  }
}



// Event Listeners
document.getElementById("pdf").addEventListener("change", function () {
  const fileName = this.files[0] ? this.files[0].name : "Nenhum arquivo selecionado";
  document.getElementById("file-name").textContent = fileName;
});

document.getElementById("pdfPortaria").addEventListener("change", function () {
  const fileName = this.files[0] ? this.files[0].name : "Nenhum arquivo selecionado";
  document.getElementById("file-name-portaria").textContent = fileName;
});



// Inicialização
document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('adminToken');
  if (token) {
    isAdminLoggedIn = true;
    document.getElementById('adminButtons').style.display = 'block';
    document.getElementById('btnLogin').innerHTML = '<i class="fa-solid fa-user"></i> Logout';
    document.getElementById('btnLogin').onclick = logout;
  }

  // Configurar eventos para os formulários
  document.getElementById("formCadastro")?.addEventListener("submit", submitForm);
  document.getElementById("formCadastroPortaria")?.addEventListener("submit", submitFormPortaria);
  document.getElementById("formPesquisaResolucao")?.addEventListener("submit", pesquisarResolucoes);
  document.getElementById("formPesquisaPortaria")?.addEventListener("submit", pesquisarPortarias);

  // Configurar botão de login
  document.getElementById("btnLogin").onclick = mostrarLogin;

  // Configurar modal de login
  document.getElementById("formLogin").addEventListener("submit", fazerLogin);
  document.querySelector(".close").onclick = fecharModal;

  // Fechar modal ao clicar fora
  window.onclick = function (event) {
    const modal = document.getElementById('modalLogin');
    if (event.target === modal) {
      fecharModal(); 
    }
  };

  setupSorting();
});




// Funções de ordenação
function setupSorting() {
  // Ordenação para Resoluções
  document.getElementById('ordenarNumeroRes')?.addEventListener('click', () => sortTable('tabelaResultadosResolucao', 0));
  document.getElementById('ordenarTipoRes')?.addEventListener('click', () => sortTable('tabelaResultadosResolucao', 1));
  document.getElementById('ordenarAnoRes')?.addEventListener('click', () => sortTable('tabelaResultadosResolucao', 2));
  document.getElementById('ordenarDataRes')?.addEventListener('click', () => sortTable('tabelaResultadosResolucao', 4));

  // Ordenação para Portarias
  document.getElementById('ordenarNumeroPort')?.addEventListener('click', () => sortTable('tabelaResultadosPortaria', 0));
  document.getElementById('ordenarAnoPort')?.addEventListener('click', () => sortTable('tabelaResultadosPortaria', 1));
  document.getElementById('ordenarDataPort')?.addEventListener('click', () => sortTable('tabelaResultadosPortaria', 3));
}



function sortTable(tableId, columnIndex) {
  const table = document.getElementById(tableId);
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const header = table.querySelectorAll('thead th')[columnIndex];
  const isAsc = header.classList.contains('asc');
  
  table.querySelectorAll('thead th').forEach(th => {
      th.classList.remove('asc', 'desc');
  });
  
  header.classList.add(isAsc ? 'desc' : 'asc');
  rows.sort((a, b) => {
      const aText = a.cells[columnIndex].textContent.trim();
      const bText = b.cells[columnIndex].textContent.trim();
      if (!isNaN(aText) && !isNaN(bText)) {
          return (parseFloat(aText) - parseFloat(bText)) * (isAsc ? -1 : 1);
      }
      if (columnIndex === 4 || columnIndex === 3) { 
          const dateA = parseDate(aText);
          const dateB = parseDate(bText);
          if (dateA && dateB) {
              return (dateA - dateB) * (isAsc ? -1 : 1);
          }
      }
      return aText.localeCompare(bText) * (isAsc ? -1 : 1);
  });
  rows.forEach(row => tbody.appendChild(row));
}




function parseDate(dateString) {
  if (dateString === 'N/A') return null;
  const parts = dateString.split('/');
  if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return null;
}


// Configuração dos toggles
document.addEventListener('DOMContentLoaded', function() {
  // Toggle de Status (Resolução)
  const statusToggle = document.getElementById('statusToggle');
  const statusValue = document.getElementById('statusValue');
  const statusHidden = document.getElementById('statusHidden');
  
  statusToggle.addEventListener('change', function() {
      if (this.checked) {
          statusValue.textContent = 'Vigente';
          statusHidden.value = 'Vigente';
      } else {
          statusValue.textContent = 'Revogada';
          statusHidden.value = 'Revogada';
      }
  });

  // Toggle de Vínculo
  const vinculoToggle = document.getElementById('vinculoToggle');
  const vinculoValue = document.getElementById('vinculoValue');
  const vinculoHidden = document.getElementById('vinculoHidden');
  const campoVinculo = document.getElementById('campoVinculo');
  
  vinculoToggle.addEventListener('change', function() {
      if (this.checked) {
          vinculoValue.textContent = 'Sim';
          vinculoHidden.value = 'Sim';
          campoVinculo.style.display = 'block';
      } else {
          vinculoValue.textContent = 'Não';
          vinculoHidden.value = 'Não';
          campoVinculo.style.display = 'none';
      }
  });

  // Toggle de Status (Portaria)
  const statusPortariaToggle = document.getElementById('statusPortariaToggle');
  const statusPortariaValue = document.getElementById('statusPortariaValue');
  const statusPortariaHidden = document.getElementById('statusPortariaHidden');
  
  statusPortariaToggle.addEventListener('change', function() {
      if (this.checked) {
          statusPortariaValue.textContent = 'Vigente';
          statusPortariaHidden.value = 'Vigente';
      } else {
          statusPortariaValue.textContent = 'Revogada';
          statusPortariaHidden.value = 'Revogada';
      }
  });
});

// Atualize a função toggleVinculo para trabalhar com o novo toggle
function toggleVinculo() {
  const vinculoToggle = document.getElementById('vinculoToggle');
  const campoVinculo = document.getElementById('campoVinculo');
  
  if (vinculoToggle.checked) {
      campoVinculo.style.display = 'block';
  } else {
      campoVinculo.style.display = 'none';
  }
}