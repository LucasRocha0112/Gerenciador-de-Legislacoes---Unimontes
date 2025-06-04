// script.js

const API_URL = "http://localhost:3000";
let isAdminLoggedIn = false;
let currentSort = { column: null, direction: 'asc' };

// Objeto de estado para paginação
const paginationState = {
  Resolucao: {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 25,
    elements: { 
      prevButton: null,
      nextButton: null,
      pageInfo: null,
      controlsContainer: null,
    }
  },
  Portaria: {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 25,
    elements: {
      prevButton: null,
      nextButton: null,
      pageInfo: null,
      controlsContainer: null,
    }
  }
};

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  const savedToken = localStorage.getItem('adminToken');
  if (savedToken) {
    isAdminLoggedIn = true;
    document.getElementById('adminButtons').style.display = 'block';
    document.getElementById('btnLogin').innerHTML = '<i class="fas fa-user"></i> Logout';
    document.getElementById('btnLogin').onclick = logout;
  }

  // Mapear elementos DOM para o estado da paginação
  paginationState.Resolucao.elements.prevButton = document.getElementById('prevPageRes');
  paginationState.Resolucao.elements.nextButton = document.getElementById('nextPageRes');
  paginationState.Resolucao.elements.pageInfo = document.getElementById('pageInfoRes');
  paginationState.Resolucao.elements.controlsContainer = document.getElementById('paginationControlsResolucao');

  paginationState.Portaria.elements.prevButton = document.getElementById('prevPagePort');
  paginationState.Portaria.elements.nextButton = document.getElementById('nextPagePort');
  paginationState.Portaria.elements.pageInfo = document.getElementById('pageInfoPort');
  paginationState.Portaria.elements.controlsContainer = document.getElementById('paginationControlsPortaria');

  initFileUploadListeners();
  initToggleListeners();
  initTableSorting();
});

// Função para obter headers de autenticação
function getAuthHeaders(isFormData = false) {
  const headers = {
    'Admin-Token': localStorage.getItem('adminToken') || ''
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

// Função para mostrar notificações toast
function showToast(type, title, message, duration = 3000) {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = '';
  switch(type) {
    case 'success': icon = '<i class="fas fa-check-circle toast-icon"></i>'; break;
    case 'error': icon = '<i class="fas fa-exclamation-circle toast-icon"></i>'; break;
    case 'warning': icon = '<i class="fas fa-exclamation-triangle toast-icon"></i>'; break;
    case 'info': icon = '<i class="fas fa-info-circle toast-icon"></i>'; break;
    default: icon = '<i class="fas fa-bell toast-icon"></i>';
  }
  toast.innerHTML = `
    ${icon}
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
  `;
  toastContainer.appendChild(toast);
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
  setTimeout(() => toast.style.opacity = '1', 10);
}

// Função para mostrar/esconder loader
function toggleLoader(show = true) {
  let loader = document.querySelector('.loader-container');
  if (show) {
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'loader-container';
      loader.innerHTML = '<div class="loader"></div>';
      document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
  } else if (loader) {
    loader.style.display = 'none';
  }
}

// Função para formatar data (DD/MM/YYYY)
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  let date = new Date(dateString);
  if (isNaN(date.getTime())) {
    date = new Date(dateString + 'T00:00:00'); 
  }
  if (isNaN(date.getTime())) {
    return 'Data Inválida';
  }
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });
}

// Inicializar listeners para upload de arquivos
function initFileUploadListeners() {
  const pdfInput = document.getElementById('pdf');
  if (pdfInput) {
    pdfInput.addEventListener('change', function() {
      document.getElementById('file-name').textContent = this.files[0]?.name || "Nenhum arquivo selecionado";
    });
  }
  const pdfPortariaInput = document.getElementById('pdfPortaria');
  if (pdfPortariaInput) {
    pdfPortariaInput.addEventListener('change', function() {
      document.getElementById('file-name-portaria').textContent = this.files[0]?.name || "Nenhum arquivo selecionado";
    });
  }
}

// Inicializar listeners para toggles
function initToggleListeners() {
  const createToggleHandler = (toggleId, valueId, hiddenId, checkedText, uncheckedText, relatedFieldId = null, displayOnChecked = 'block') => {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('change', function() {
        const valueDisplay = document.getElementById(valueId);
        const hiddenInput = document.getElementById(hiddenId);
        if (this.checked) {
          if (valueDisplay) valueDisplay.textContent = checkedText;
          if (hiddenInput) hiddenInput.value = checkedText;
          if (relatedFieldId) document.getElementById(relatedFieldId).style.display = displayOnChecked;
        } else {
          if (valueDisplay) valueDisplay.textContent = uncheckedText;
          if (hiddenInput) hiddenInput.value = uncheckedText;
          if (relatedFieldId) document.getElementById(relatedFieldId).style.display = 'none';
        }
      });
      toggle.dispatchEvent(new Event('change'));
    }
  };
  createToggleHandler('statusToggle', 'statusValue', 'statusHidden', 'Vigente', 'Revogada');
  createToggleHandler('vinculoToggle', 'vinculoValue', 'vinculoHidden', 'Sim', 'Não', 'campoVinculo');
  createToggleHandler('statusPortariaToggle', 'statusPortariaValue', 'statusPortariaHidden', 'Vigente', 'Revogada');
  createToggleHandler('statusPesquisaToggle', 'statusPesquisaValue', 'statusPesquisaHidden', 'Vigente', 'Revogada');
  createToggleHandler('statusPortariaPesquisaToggle', 'statusPortariaPesquisaValue', 'statusPortariaPesquisaHidden', 'Vigente', 'Revogada');
}

// Inicializar ordenação de tabelas
function initTableSorting() {
  const setupSortingForTable = (tableSelector, idPrefix, typeSuffix) => {
    const thElements = document.querySelectorAll(`${tableSelector} th[id^="${idPrefix}"]`);
    thElements.forEach(th => {
      th.addEventListener('click', function() {
        const column = this.id.replace(idPrefix, '').replace(typeSuffix, '').toLowerCase();
        sortTable(tableSelector.substring(1), column, this);
      });
    });
  };
  setupSortingForTable('#tabelaResultadosResolucao', 'ordenar', 'Res');
  setupSortingForTable('#tabelaResultadosPortaria', 'ordenar', 'Port');
}

// Função para ordenar tabela
function sortTable(tableId, column, clickedHeader) {
  const table = document.getElementById(tableId);
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  const rows = Array.from(tbody.querySelectorAll('tr'));

  if (rows.length === 0 || rows[0].classList.contains('no-results')) return;

  let direction = (currentSort.column === column && currentSort.direction === 'asc') ? 'desc' : 'asc';
  currentSort.column = column;
  currentSort.direction = direction;

  table.querySelectorAll('th[id^="ordenar"]').forEach(header => {
    header.classList.remove('sorted-asc', 'sorted-desc');
    const icon = header.querySelector('i');
    if (icon) icon.className = 'fa fa-sort';
  });

  if (clickedHeader) {
    clickedHeader.classList.add(`sorted-${direction}`);
    const icon = clickedHeader.querySelector('i');
    if (icon) icon.className = direction === 'asc' ? 'fa fa-sort-asc' : 'fa fa-sort-desc';
  }

  const columnIndexMap = {
    tabelaResultadosResolucao: { numero: 0, tipo: 1, ano: 2, assunto: 3, data: 4, status: 5, vinculo: 6 },
    tabelaResultadosPortaria: { numero: 0, ano: 1, assunto: 2, data: 3, status: 4 }
  };
  const colMap = columnIndexMap[tableId];
  if (!colMap) return;
  const columnIndex = colMap[column];
  if (columnIndex === undefined) return;

  rows.sort((a, b) => {
    let aValue = a.cells[columnIndex]?.textContent.trim() || '';
    let bValue = b.cells[columnIndex]?.textContent.trim() || '';

    if (column === 'numero' || column === 'ano') {
      aValue = parseInt(aValue, 10) || 0;
      bValue = parseInt(bValue, 10) || 0;
    } else if (column === 'data') {
      const parseDate = (dateStr) => {
        const parts = dateStr.split('/');
        return parts.length === 3 ? new Date(parts[2], parts[1] - 1, parts[0]) : new Date(0);
      };
      aValue = parseDate(aValue);
      bValue = parseDate(bValue);
    } else {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  rows.forEach(row => tbody.appendChild(row));
}

// ========== FUNÇÕES DE LOGIN/LOGOUT ==========
function mostrarLogin() {
  document.getElementById('modalLogin').style.display = 'flex';
  document.getElementById('modalLogin').classList.add('active');
  document.getElementById('usuario').focus();
}
function fecharModal() {
  const modal = document.getElementById('modalLogin');
  modal.classList.remove('active');
  setTimeout(() => { modal.style.display = 'none'; }, 300);
}
async function fazerLogin(event) {
  event.preventDefault();
  const usuario = document.getElementById('usuario').value;
  const senha = document.getElementById('senha').value;
  if (!usuario || !senha) { showToast('error', 'Erro', 'Preencha todos os campos'); return; }
  toggleLoader(true);
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST", headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ usuario, senha })
    });
    const data = await response.json();
    if (!response.ok) { throw new Error(data.message || 'Erro no login'); }
    isAdminLoggedIn = true;
    localStorage.setItem('adminToken', data.token);
    document.getElementById('adminButtons').style.display = 'block';
    document.getElementById('btnLogin').innerHTML = '<i class="fas fa-user"></i> Logout';
    document.getElementById('btnLogin').onclick = logout;
    fecharModal();
    showToast('success', 'Sucesso', 'Login realizado com sucesso');
  } catch (error) {
    console.error('Erro no login:', error); showToast('error', 'Erro', error.message || 'Erro ao fazer login');
  } finally { toggleLoader(false); }
}
function logout() {
  isAdminLoggedIn = false;
  localStorage.removeItem('adminToken');
  document.getElementById('adminButtons').style.display = 'none';
  document.getElementById('btnLogin').innerHTML = '<i class="fas fa-user"></i>';
  document.getElementById('btnLogin').onclick = mostrarLogin;
  voltarPaginaInicial();
  showToast('info', 'Logout', 'Você saiu do sistema');
}

// ========== NAVEGAÇÃO ENTRE TELAS ==========
function openTab(evt, tabName) {
  Array.from(document.getElementsByClassName("tabcontent")).forEach(tab => tab.style.display = "none");
  document.getElementById("telaInicial").style.display = "none";
  if(paginationState.Resolucao.elements.controlsContainer) paginationState.Resolucao.elements.controlsContainer.style.display = 'none';
  if(paginationState.Portaria.elements.controlsContainer) paginationState.Portaria.elements.controlsContainer.style.display = 'none';

  const targetTab = document.getElementById(tabName);
  targetTab.style.display = "block";
  targetTab.style.animation = 'none';
  targetTab.offsetHeight;
  targetTab.style.animation = 'fadeIn 0.5s ease-out';

  if (evt && evt.currentTarget) evt.currentTarget.classList.add("active"); 
  document.getElementById('btnVoltarContainer').style.display = (tabName !== 'telaInicial') ? 'block' : 'none';
  currentSort = { column: null, direction: 'asc' };
  resetTableSortIcons();
}
function voltar() {
  const currentTab = document.querySelector('.tabcontent[style*="display: block"], .tabcontent[style*="display: flex"]');
  if (!currentTab) { voltarPaginaInicial(); return; }
  const id = currentTab.id;
  if (id === 'pesquisaResolucao' || id === 'pesquisaPortaria') openTab(null, 'pesquisa');
  else if (id === 'pesquisa') voltarPaginaInicial();
  else if (id === 'cadastroResolucao' || id === 'cadastroPortaria') {
    (document.getElementById('opcoesCadastro').style.display === 'flex' || document.getElementById('opcoesCadastro').style.display === 'block') ?
      voltarPaginaInicial() : mostrarOpcoesCadastro();
  } else voltarPaginaInicial();
  if (document.getElementById('telaInicial').style.display === 'flex' || document.getElementById('telaInicial').style.display === 'block') {
    document.getElementById('btnVoltarContainer').style.display = 'none';
  }
  currentSort = { column: null, direction: 'asc' };
  resetTableSortIcons();
  if(paginationState.Resolucao.elements.controlsContainer) paginationState.Resolucao.elements.controlsContainer.style.display = 'none';
  if(paginationState.Portaria.elements.controlsContainer) paginationState.Portaria.elements.controlsContainer.style.display = 'none';
}
function voltarPaginaInicial() {
  document.getElementById("telaInicial").style.display = "flex";
  Array.from(document.getElementsByClassName("tabcontent")).forEach(tab => tab.style.display = "none");
  document.getElementById('btnVoltarContainer').style.display = 'none';
  document.getElementById('opcoesCadastro').style.display = 'none';
  document.querySelector("#telaInicial .button-container").style.display = "flex";
  const telaInicial = document.getElementById("telaInicial");
  telaInicial.style.animation = 'none';
  telaInicial.offsetHeight;
  telaInicial.style.animation = 'fadeIn 0.5s ease-out';
  currentSort = { column: null, direction: 'asc' };
  resetTableSortIcons();
  if(paginationState.Resolucao.elements.controlsContainer) paginationState.Resolucao.elements.controlsContainer.style.display = 'none';
  if(paginationState.Portaria.elements.controlsContainer) paginationState.Portaria.elements.controlsContainer.style.display = 'none';
}
function openPesquisa() { openTab(null, 'pesquisa'); }
function openPesquisaResolucao() {
  openTab(null, 'pesquisaResolucao');
  document.getElementById("formPesquisaResolucao").reset();
  const statusToggleRes = document.getElementById('statusPesquisaToggle');
  if (statusToggleRes) { statusToggleRes.checked = true; statusToggleRes.dispatchEvent(new Event('change'));}
  document.getElementById("resultadosPesquisaResolucao").style.display = "none";
  paginationState.Resolucao.currentPage = 1; 
}
function openPesquisaPortaria() {
  openTab(null, 'pesquisaPortaria');
  document.getElementById("formPesquisaPortaria").reset();
  const statusTogglePort = document.getElementById('statusPortariaPesquisaToggle');
  if (statusTogglePort) { statusTogglePort.checked = true; statusTogglePort.dispatchEvent(new Event('change'));}
  document.getElementById("resultadosPesquisaPortaria").style.display = "none";
  paginationState.Portaria.currentPage = 1; 
}
function mostrarOpcoesCadastro() {
  document.querySelector("#telaInicial .button-container").style.display = "none";
  document.getElementById("opcoesCadastro").style.display = "flex";
  document.getElementById('btnVoltarContainer').style.display = 'block';
  const opcoesCadastro = document.getElementById("opcoesCadastro");
  opcoesCadastro.style.animation = 'none';
  opcoesCadastro.offsetHeight;
  opcoesCadastro.style.animation = 'fadeIn 0.5s ease-out';
  currentSort = { column: null, direction: 'asc' };
  resetTableSortIcons();
}
function resetTableSortIcons() {
  document.querySelectorAll('th[id^="ordenar"]').forEach(header => {
    header.classList.remove('sorted-asc', 'sorted-desc');
    const icon = header.querySelector('i');
    if (icon) icon.className = 'fa fa-sort';
  });
}

// ========== FUNÇÕES DE CADASTRO ==========
async function submitForm(event) {
  event.preventDefault();
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
  try {
    const formData = new FormData(event.target);
    formData.set('status', document.getElementById('statusHidden').value);
    formData.set('vinculo', document.getElementById('vinculoHidden').value);
    if (!formData.get('numero') || !formData.get('tipo') || !formData.get('ano') || !formData.get('assunto') || !formData.get('data') || !formData.get('pdf').name) {
      throw new Error('Todos os campos obrigatórios devem ser preenchidos.');
    }
    if (formData.get('pdf').size > 5 * 1024 * 1024) throw new Error('O arquivo PDF deve ter no máximo 5MB.');
    toggleLoader(true);
    const response = await fetch(`${API_URL}/cadastrar-resolucao`, { method: "POST", headers: getAuthHeaders(true), body: formData });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Erro ao cadastrar resolução.");
    showToast('success', 'Sucesso', 'Resolução cadastrada com sucesso!');
    limparFormulario();
  } catch (error) { console.error("Erro no cadastro de Resolução:", error); showToast('error', 'Erro', error.message); }
  finally { submitBtn.disabled = false; submitBtn.innerHTML = originalText; toggleLoader(false); }
}
async function submitFormPortaria(event) {
  event.preventDefault();
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
  try {
    const formData = new FormData(event.target);
    formData.set('statusPortaria', document.getElementById('statusPortariaHidden').value);
    if (!formData.get('numeroPortaria') || !formData.get('anoPortaria') || !formData.get('assuntoPortaria') || !formData.get('dataPortaria') || !formData.get('pdfPortaria').name) {
      throw new Error('Todos os campos obrigatórios devem ser preenchidos.');
    }
    if (formData.get('pdfPortaria').size > 5 * 1024 * 1024) throw new Error('O arquivo PDF deve ter no máximo 5MB.');
    toggleLoader(true);
    const response = await fetch(`${API_URL}/cadastrar-portaria`, { method: "POST", headers: getAuthHeaders(true), body: formData });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Erro ao cadastrar portaria.");
    showToast('success', 'Sucesso', 'Portaria cadastrada com sucesso!');
    limparFormularioPortaria();
  } catch (error) { console.error("Erro no cadastro de Portaria:", error); showToast('error', 'Erro', error.message); }
  finally { submitBtn.disabled = false; submitBtn.innerHTML = originalText; toggleLoader(false); }
}
function limparFormulario() {
  document.getElementById("formCadastro").reset();
  document.getElementById("file-name").textContent = "Nenhum arquivo selecionado";
  const statusToggle = document.getElementById('statusToggle');
  if(statusToggle) { statusToggle.checked = true; statusToggle.dispatchEvent(new Event('change'));}
  const vinculoToggle = document.getElementById('vinculoToggle');
  if(vinculoToggle) { vinculoToggle.checked = false; vinculoToggle.dispatchEvent(new Event('change'));}
  showToast('info', 'Formulário', 'Formulário limpo.');
}
function limparFormularioPortaria() {
  document.getElementById("formCadastroPortaria").reset();
  document.getElementById("file-name-portaria").textContent = "Nenhum arquivo selecionado";
  const statusPortariaToggle = document.getElementById('statusPortariaToggle');
  if(statusPortariaToggle) { statusPortariaToggle.checked = true; statusPortariaToggle.dispatchEvent(new Event('change'));}
  showToast('info', 'Formulário', 'Formulário limpo.');
}

// ========== FUNÇÕES DE PESQUISA ==========
async function pesquisarResolucoes(event, pageRequest) {
  if (event) event.preventDefault(); 
  toggleLoader(true);
  const currentPage = event ? 1 : pageRequest;
  paginationState.Resolucao.currentPage = currentPage; 

  const numero = document.getElementById("numeroPesquisa").value.trim();
  const ano = document.getElementById("anoPesquisa").value.trim();
  const tipo = document.getElementById("tipoPesquisa").value.trim();
  const status = document.getElementById("statusPesquisaHidden").value;
  const assunto = document.getElementById("assuntoPesquisa").value.trim();

  try {
    const queryParams = new URLSearchParams();
    if (numero) queryParams.append("numero", numero);
    if (ano) queryParams.append("ano", ano);
    if (tipo) queryParams.append("tipo", tipo);
    if (status) queryParams.append("status", status);
    if (assunto) queryParams.append("assunto", assunto);
    queryParams.append("page", paginationState.Resolucao.currentPage);
    queryParams.append("limit", paginationState.Resolucao.itemsPerPage);

    const response = await fetch(`${API_URL}/resolucoes?${queryParams.toString()}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Erro na pesquisa de resoluções.");

    const resolucoes = result.data;
    const backendPagination = result.pagination;

    if (!resolucoes || resolucoes.length === 0) {
      showToast('info', 'Pesquisa', 'Nenhuma resolução encontrada.');
      document.getElementById("tabelaResultadosResolucao").querySelector("tbody").innerHTML = '<tr><td colspan="8" class="no-results">Nenhuma resolução encontrada.</td></tr>';
      document.getElementById("resultadosPesquisaResolucao").style.display = "block";
      if(paginationState.Resolucao.elements.controlsContainer) paginationState.Resolucao.elements.controlsContainer.style.display = 'none';
      return;
    }
    showToast('success', 'Pesquisa', `${backendPagination.totalItems} resolução(ões) encontrada(s).`);
    exibirResultadosResolucao(resolucoes); 
    setupPagination('Resolucao', backendPagination); 
    document.getElementById("resultadosPesquisaResolucao").style.display = "block";
  } catch (error) {
    console.error("Erro ao buscar resoluções:", error);
    showToast('error', 'Erro', error.message);
    document.getElementById("tabelaResultadosResolucao").querySelector("tbody").innerHTML = `<tr><td colspan="8" class="no-results">Erro ao carregar resoluções.</td></tr>`;
    document.getElementById("resultadosPesquisaResolucao").style.display = "block";
    if(paginationState.Resolucao.elements.controlsContainer) paginationState.Resolucao.elements.controlsContainer.style.display = 'none';
  } finally { toggleLoader(false); }
}

async function pesquisarPortarias(event, pageRequest) {
  if (event) event.preventDefault();
  toggleLoader(true);
  const currentPage = event ? 1 : pageRequest;
  paginationState.Portaria.currentPage = currentPage;

  const numero = document.getElementById("numeroPesquisaPort").value.trim();
  const ano = document.getElementById("anoPesquisaPort").value.trim();
  const status = document.getElementById("statusPortariaPesquisaHidden").value;
  const assunto = document.getElementById("assuntoPesquisaPort").value.trim();

  try {
    const queryParams = new URLSearchParams();
    if (numero) queryParams.append("numero", numero);
    if (ano) queryParams.append("ano", ano);
    if (status) queryParams.append("status", status);
    if (assunto) queryParams.append("assunto", assunto);
    queryParams.append("page", paginationState.Portaria.currentPage);
    queryParams.append("limit", paginationState.Portaria.itemsPerPage);

    const response = await fetch(`${API_URL}/portarias?${queryParams.toString()}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Erro na pesquisa de portarias.");

    const portarias = result.data;
    const backendPagination = result.pagination;

    if (!portarias || portarias.length === 0) {
      showToast('info', 'Pesquisa', 'Nenhuma portaria encontrada.');
      document.getElementById("tabelaResultadosPortaria").querySelector("tbody").innerHTML = '<tr><td colspan="6" class="no-results">Nenhuma portaria encontrada.</td></tr>';
      document.getElementById("resultadosPesquisaPortaria").style.display = "block";
      if(paginationState.Portaria.elements.controlsContainer) paginationState.Portaria.elements.controlsContainer.style.display = 'none';
      return;
    }
    showToast('success', 'Pesquisa', `${backendPagination.totalItems} portaria(s) encontrada(s).`);
    exibirResultadosPortaria(portarias); 
    setupPagination('Portaria', backendPagination); 
    document.getElementById("resultadosPesquisaPortaria").style.display = "block";
  } catch (error) {
    console.error("Erro ao buscar portarias:", error);
    showToast('error', 'Erro', error.message);
    document.getElementById("tabelaResultadosPortaria").querySelector("tbody").innerHTML = `<tr><td colspan="6" class="no-results">Erro ao carregar portarias.</td></tr>`;
    document.getElementById("resultadosPesquisaPortaria").style.display = "block";
    if(paginationState.Portaria.elements.controlsContainer) paginationState.Portaria.elements.controlsContainer.style.display = 'none';
  } finally { toggleLoader(false); }
}

// ========== EXIBIÇÃO DE RESULTADOS E PAGINAÇÃO ==========
function exibirResultadosResolucao(resolucoes) { 
  const tabelaBody = document.getElementById("tabelaResultadosResolucao").querySelector("tbody");
  tabelaBody.innerHTML = "";
  if (!resolucoes || resolucoes.length === 0) {
    return;
  }
  resolucoes.forEach(r => {
    const row = tabelaBody.insertRow();
    row.insertCell().textContent = r.numero || 'N/A';
    row.insertCell().textContent = r.tipo || 'N/A';
    row.insertCell().textContent = r.ano || 'N/A';
    row.insertCell().textContent = r.assunto || 'N/A';
    row.insertCell().textContent = formatDate(r.data);
    row.insertCell().textContent = r.status || 'N/A';
    row.insertCell().textContent = r.vinculo_resolucao || "N/A";
    const actionsCell = row.insertCell();
    actionsCell.className = 'acoes-botoes';
    actionsCell.innerHTML = `
      <button class="botao-acao visualizar" onclick="visualizarPDF('${r.pdf}')" title="Visualizar PDF"><i class="fa fa-file-pdf"></i></button>
      ${isAdminLoggedIn ? `<button class="botao-acao excluir" onclick="confirmarExclusao('resolucao', ${r.id})" title="Excluir resolução"><i class="fa fa-trash"></i></button>` : ''}
    `;
  });
}

function exibirResultadosPortaria(portarias) { 
  const tabelaBody = document.getElementById("tabelaResultadosPortaria").querySelector("tbody");
  tabelaBody.innerHTML = "";
  if (!portarias || portarias.length === 0) {
    return;
  }
  portarias.forEach(p => {
    const row = tabelaBody.insertRow();
    row.insertCell().textContent = p.numero || 'N/A';
    row.insertCell().textContent = p.ano || 'N/A';
    row.insertCell().textContent = p.assunto || 'N/A';
    row.insertCell().textContent = formatDate(p.data);
    row.insertCell().textContent = p.status || 'N/A';
    const actionsCell = row.insertCell();
    actionsCell.className = 'acoes-botoes';
    actionsCell.innerHTML = `
      <button class="botao-acao visualizar" onclick="visualizarPDF('${p.pdf}')" title="Visualizar PDF"><i class="fa fa-file-pdf"></i></button>
      ${isAdminLoggedIn ? `<button class="botao-acao excluir" onclick="confirmarExclusao('portaria', ${p.id})" title="Excluir portaria"><i class="fa fa-trash"></i></button>` : ''}
    `;
  });
}

// PAGINAÇÃO
function setupPagination(type, backendPaginationData) {
  const state = paginationState[type];
  const elements = state.elements;

  if (!elements.prevButton || !elements.nextButton || !elements.pageInfo || !elements.controlsContainer) {
    console.warn(`Elementos de paginação para ${type} não encontrados ou não inicializados.`);
    return;
  }
  state.currentPage = Number(backendPaginationData.currentPage);
  state.totalPages = Number(backendPaginationData.totalPages);

  if (isNaN(state.currentPage) || isNaN(state.totalPages) || state.totalPages <= 0) {
    elements.pageInfo.textContent = 'Paginação indisponível';
    elements.prevButton.disabled = true;
    elements.nextButton.disabled = true;
    elements.controlsContainer.style.display = 'none';
    return;
  }

  elements.pageInfo.textContent = `Página ${state.currentPage} de ${state.totalPages}`;
  elements.prevButton.disabled = state.currentPage <= 1;
  elements.nextButton.disabled = state.currentPage >= state.totalPages;

  const newPrevButton = elements.prevButton.cloneNode(true);
  elements.prevButton.parentNode.replaceChild(newPrevButton, elements.prevButton);
  elements.prevButton = newPrevButton; 

  const newNextButton = elements.nextButton.cloneNode(true);
  elements.nextButton.parentNode.replaceChild(newNextButton, elements.nextButton);
  elements.nextButton = newNextButton; 
  elements.prevButton.addEventListener('click', () => {
    if (state.currentPage > 1) {
      if (type === 'Resolucao') pesquisarResolucoes(null, state.currentPage - 1);
      else if (type === 'Portaria') pesquisarPortarias(null, state.currentPage - 1);
    }
  });

  elements.nextButton.addEventListener('click', () => {
    if (state.currentPage < state.totalPages) {
      if (type === 'Resolucao') pesquisarResolucoes(null, state.currentPage + 1);
      else if (type === 'Portaria') pesquisarPortarias(null, state.currentPage + 1);
    }
  });
  
  elements.controlsContainer.style.display = state.totalPages > 1 ? 'flex' : 'none';
}


// ========== VISUALIZAR PDF ==========
function visualizarPDF(pdfPath) {
  if (pdfPath && pdfPath !== 'null' && pdfPath !== 'undefined') {
    window.open(`${API_URL}/uploads/${pdfPath}`, "_blank");
  } else {
    showToast('warning', 'PDF Indisponível', 'Nenhum arquivo PDF associado.');
  }
}

// ========== FUNÇÕES DE EXCLUSÃO ==========
function criarModalConfirmacao(mensagem, callbackConfirmacao) {
  document.getElementById('modalConfirmacaoExclusao')?.remove();
  const modal = document.createElement('div');
  modal.id = 'modalConfirmacaoExclusao';
  modal.className = 'modal active'; modal.style.display = 'flex';
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  const titulo = document.createElement('h2'); titulo.textContent = 'Confirmar Exclusão';
  const pMensagem = document.createElement('p'); pMensagem.textContent = mensagem;
  pMensagem.style.textAlign = 'center'; pMensagem.style.marginBottom = 'var(--spacing-lg)';
  const btnConfirmar = document.createElement('button'); btnConfirmar.textContent = 'Confirmar';
  btnConfirmar.className = 'botao-padrao'; btnConfirmar.style.backgroundColor = 'var(--danger)';
  const btnCancelar = document.createElement('button'); btnCancelar.textContent = 'Cancelar';
  btnCancelar.className = 'botao-padrao'; btnCancelar.style.backgroundColor = 'var(--text-secondary)';
  const buttonGroup = document.createElement('div'); buttonGroup.className = 'form-button-group';
  buttonGroup.append(btnCancelar, btnConfirmar);
  modalContent.append(titulo, pMensagem, buttonGroup);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  btnConfirmar.onclick = () => { callbackConfirmacao(); modal.remove(); };
  btnCancelar.onclick = () => modal.remove();
}
function confirmarExclusao(tipo, id) {
  if (!isAdminLoggedIn) { showToast('error', 'Acesso Negado', `Apenas administradores podem excluir.`); return; }
  const mensagem = `Deseja realmente excluir esta ${tipo === 'resolucao' ? 'resolução' : 'portaria'}? Esta ação não pode ser desfeita.`;
  criarModalConfirmacao(mensagem, () => {
    if (tipo === 'resolucao') excluirResolucao(id);
    else if (tipo === 'portaria') excluirPortaria(id);
  });
}
async function excluirResolucao(id) {
  toggleLoader(true);
  try {
    const response = await fetch(`${API_URL}/resolucoes/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Erro ao excluir resolução.");
    showToast('success', 'Sucesso', 'Resolução excluída.');
    const tabelaBody = document.getElementById("tabelaResultadosResolucao").querySelector("tbody");
    const isLastItemOnPage = tabelaBody && tabelaBody.rows.length === 1; 
    const currentPageToLoad = (isLastItemOnPage && paginationState.Resolucao.currentPage > 1) ?
                              paginationState.Resolucao.currentPage - 1 :
                              paginationState.Resolucao.currentPage;
    pesquisarResolucoes(null, currentPageToLoad);
  } catch (error) { console.error("Erro ao excluir resolução:", error); showToast('error', 'Erro', error.message); }
  finally { toggleLoader(false); }
}
async function excluirPortaria(id) {
  toggleLoader(true);
  try {
    const response = await fetch(`${API_URL}/portarias/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Erro ao excluir portaria.");
    showToast('success', 'Sucesso', 'Portaria excluída.');
    const tabelaBody = document.getElementById("tabelaResultadosPortaria").querySelector("tbody");
    const isLastItemOnPage = tabelaBody && tabelaBody.rows.length === 1;
    const currentPageToLoad = (isLastItemOnPage && paginationState.Portaria.currentPage > 1) ?
                              paginationState.Portaria.currentPage - 1 :
                              paginationState.Portaria.currentPage;
    pesquisarPortarias(null, currentPageToLoad);
  } catch (error) { console.error("Erro ao excluir portaria:", error); showToast('error', 'Erro', error.message); }
  finally { toggleLoader(false); }
}
