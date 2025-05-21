const API_URL = "http://localhost:3000";
let isAdminLoggedIn = false;

// Função para obter headers de autenticação
function getAuthHeaders(isFormData = false) {
  const headers = {
    'Admin-Token': localStorage.getItem('adminToken') || 'admin123'
  };
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
}

// ========== FUNÇÕES DE LOGIN/LOGOUT ==========
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro no login');
    }

    const data = await response.json();
    
    isAdminLoggedIn = true;
    localStorage.setItem('adminToken', data.token);
    document.getElementById('adminButtons').style.display = 'block';
    document.getElementById('btnLogin').innerHTML = '<i class="fas fa-user"></i> Logout';
    document.getElementById('btnLogin').onclick = logout;
    fecharModal();
    
  } catch (error) {
    console.error('Erro:', error);
    alert(error.message || 'Erro ao fazer login');
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

// ========== NAVEGAÇÃO ENTRE TELAS ==========
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

// ========== FUNÇÕES DE CADASTRO ==========
async function submitForm(event) {
  event.preventDefault();
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

  try {
    const formData = new FormData(event.target);
    
    // Adiciona os valores dos toggles ao FormData
    formData.set('status', document.getElementById('statusHidden').value);
    formData.set('vinculo', document.getElementById('vinculoHidden').value);
    
    // DEBUG: Mostrar conteúdo do FormData
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
    const response = await fetch(`${API_URL}/cadastrar-resolucao`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao cadastrar resolução");
    }

    alert("Resolução cadastrada com sucesso!");
    event.target.reset();
    document.getElementById("file-name").textContent = "Nenhum arquivo selecionado";
    
    // Reseta os toggles para os valores padrão
    document.getElementById('statusToggle').checked = true;
    document.getElementById('statusValue').textContent = 'Vigente';
    document.getElementById('statusHidden').value = 'Vigente';
    
    document.getElementById('vinculoToggle').checked = false;
    document.getElementById('vinculoValue').textContent = 'Não';
    document.getElementById('vinculoHidden').value = 'Não';
    document.getElementById('campoVinculo').style.display = 'none';
    
  } catch (error) {
    console.error("Erro no cadastro:", error);
    alert(`Erro ao cadastrar: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function submitFormPortaria(event) {
  event.preventDefault();
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

  try {
    const formData = new FormData(event.target);
    
    const response = await fetch(`${API_URL}/cadastrar-portaria`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Erro ao cadastrar portaria");
    }

    alert("Portaria cadastrada com sucesso!");
    event.target.reset();
    document.getElementById("file-name-portaria").textContent = "Nenhum arquivo selecionado";
    document.getElementById('statusPortariaToggle').checked = true;
    document.getElementById('statusPortariaValue').textContent = 'Vigente';
    document.getElementById('statusPortariaHidden').value = 'Vigente';
    voltarPaginaInicial();
    
  } catch (error) {
    console.error("Erro no cadastro:", error);
    alert(`Erro ao cadastrar: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// ========== FUNÇÕES DE PESQUISA ==========
async function pesquisarResolucoes(event) {
  event.preventDefault();

  const numero = document.getElementById("numeroPesquisa").value.trim();
  const ano = document.getElementById("anoPesquisa").value.trim();
  const tipo = document.getElementById("tipoPesquisa").value.trim();
  const status = document.getElementById("statusPesquisaHidden").value;
  const assunto = document.getElementById("assuntoPesquisa").value.trim();

  const queryParams = new URLSearchParams();
  if (numero) queryParams.append("numero", numero);
  if (ano) queryParams.append("ano", ano);
  if (tipo) queryParams.append("tipo", tipo);
  if (status) queryParams.append("status", status);
  if (assunto) queryParams.append("assunto", assunto);

  try {
    const response = await fetch(`${API_URL}/resolucoes?${queryParams.toString()}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Erro na pesquisa");
    }
    
    const resolucoes = data.data || data;
    
    if (!resolucoes || resolucoes.length === 0) {
      alert("Nenhuma resolução encontrada com os critérios informados.");
      return;
    }
    
    exibirResultadosResolucoes(resolucoes);
    document.getElementById("resultadosPesquisaResolucao").style.display = "block";
    
  } catch (error) {
    console.error("Erro ao buscar resoluções:", error);
    alert(`Erro na pesquisa: ${error.message}`);
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
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Erro na pesquisa");
    }
    
    const portarias = data.data || data;
    
    if (!portarias || portarias.length === 0) {
      alert("Nenhuma portaria encontrada com os critérios informados.");
      return;
    }
    
    exibirResultadosPortarias(portarias);
    document.getElementById("resultadosPesquisaPortaria").style.display = "block";
    
  } catch (error) {
    console.error("Erro ao buscar portarias:", error);
    alert(`Erro na pesquisa: ${error.message}`);
  }
}

// ========== EXIBIÇÃO DE RESULTADOS ==========
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

// ========== VISUALIZAR PDF ==========
function visualizarPDF(pdfPath) {
  if (pdfPath) {
    const url = `${API_URL}/uploads/${pdfPath}`;
    window.open(url, "_blank");
  } else {
    alert("Nenhum PDF disponível para este documento.");
  }
}

// ========== FUNÇÕES DE EXCLUSÃO ==========
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

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Erro ao excluir resolução");
      }

      alert("Resolução excluída com sucesso!");
      document.getElementById("formPesquisaResolucao").dispatchEvent(new Event("submit"));
      
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert(`Erro ao excluir: ${error.message}`);
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

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Erro ao excluir portaria");
      }

      alert("Portaria excluída com sucesso!");
      document.getElementById("formPesquisaPortaria").dispatchEvent(new Event("submit"));
      
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert(`Erro ao excluir: ${error.message}`);
    }
  }
}

// ========== FUNÇÕES AUXILIARES ==========
function limparFormulario() {
  if (confirm("Tem certeza que deseja limpar todos os campos?")) {
    document.getElementById("formCadastro").reset();
    document.getElementById('statusToggle').checked = true;
    document.getElementById('statusValue').textContent = 'Vigente';
    document.getElementById('statusHidden').value = 'Vigente';
    
    document.getElementById('vinculoToggle').checked = false;
    document.getElementById('vinculoValue').textContent = 'Não';
    document.getElementById('vinculoHidden').value = 'Não';
    document.getElementById('campoVinculo').style.display = 'none';
    
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

// ========== CONFIGURAÇÃO DE TOGGLES E EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', function() {
  // Configura os listeners para os toggles
  const statusToggle = document.getElementById('statusToggle');
  if (statusToggle) {
    statusToggle.addEventListener('change', function() {
      const value = this.checked ? 'Vigente' : 'Revogada';
      document.getElementById('statusValue').textContent = value;
      document.getElementById('statusHidden').value = value;
    });
  }

  const vinculoToggle = document.getElementById('vinculoToggle');
  if (vinculoToggle) {
    vinculoToggle.addEventListener('change', function() {
      const value = this.checked ? 'Sim' : 'Não';
      document.getElementById('vinculoValue').textContent = value;
      document.getElementById('vinculoHidden').value = value;
      document.getElementById('campoVinculo').style.display = this.checked ? 'block' : 'none';
    });
  }

  // Toggle de Status (Portaria)
  const statusPortariaToggle = document.getElementById('statusPortariaToggle');
  if (statusPortariaToggle) {
    statusPortariaToggle.addEventListener('change', function() {
      const value = this.checked ? 'Vigente' : 'Revogada';
      document.getElementById('statusPortariaValue').textContent = value;
      document.getElementById('statusPortariaHidden').value = value;
    });
  }

  // Event Listeners para arquivos
  const pdfInput = document.getElementById('pdf');
  if (pdfInput) {
    pdfInput.addEventListener('change', function() {
      const fileName = this.files[0] ? this.files[0].name : 'Nenhum arquivo selecionado';
      document.getElementById('file-name').textContent = fileName;
    });
  }

  const pdfPortariaInput = document.getElementById("pdfPortaria");
  if (pdfPortariaInput) {
    pdfPortariaInput.addEventListener("change", function() {
      const fileName = this.files[0] ? this.files[0].name : "Nenhum arquivo selecionado";
      document.getElementById("file-name-portaria").textContent = fileName;
    });
  }

  // Verificar se o usuário está logado ao carregar a página
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    isAdminLoggedIn = true;
    document.getElementById('adminButtons').style.display = 'block';
    document.getElementById('btnLogin').innerHTML = '<i class="fas fa-user"></i> Logout';
    document.getElementById('btnLogin').onclick = logout;
  }

  // Configurar ordenação de tabelas
  setupSorting();

  // Testar conexão com o servidor
  async function testarConexao() {
    try {
      const response = await fetch(API_URL);
      console.log("Servidor respondendo:", response.status);
      return response.ok;
    } catch (error) {
      console.error("Servidor não está respondendo:", error);
      return false;
    }
  }

  testarConexao().then(conectado => {
    if (!conectado) {
      alert("Não foi possível conectar ao servidor. Verifique se o servidor está rodando.");
    }
  });
});

// ========== FUNÇÕES DE ORDENAÇÃO ==========
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

