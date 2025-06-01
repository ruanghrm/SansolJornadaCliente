const API_BASE = "https://www.sansolenergiasolar.com.br/python";
const token = localStorage.getItem("access_token");

//---------------- MODAL SELECIONAR CLIENTE //----------------------

// Variável global para guardar o cliente selecionado
window.selectedClientGlobal = null;

// Instância única do modal para evitar múltiplos backdrops/travas
let selectClientModalInstance = null;

// Função para abrir o modal
function openSelectClientModal() {
  if (!selectClientModalInstance) {
    selectClientModalInstance = new bootstrap.Modal(document.getElementById('selectClientModal'));
  }
  selectClientModalInstance.show();
  loadClientList();
}

// Função que faz o GET autenticado
function loadClientList() {
  const clientListContainer = document.getElementById('clientListContainer');
  clientListContainer.innerHTML = '<p>Carregando clientes...</p>';

  fetch(`${API_BASE}/clientes/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Incluindo o token JWT no header
    }
  })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autorizado. Faça login novamente.');
        }
        throw new Error('Erro ao carregar clientes.');
      }
      return response.json();
    })
    .then(clients => {
      console.log('👥 Clientes carregados do backend:', clients);
      renderClientList(clients);
    })
    .catch(error => {
      clientListContainer.innerHTML = `<p class="text-danger">${error.message}</p>`;
    });
}

function renderClientList(clients) {
  const container = document.getElementById('clientListContainer');
  container.innerHTML = '';

  clients.forEach(client => {
    const clientItem = document.createElement('div');
    clientItem.className = 'client-item d-flex justify-content-between align-items-center';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'client-name';
    nameDiv.textContent = client.nome_completo;

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'client-details d-flex align-items-center';
    detailsDiv.innerHTML = `
      <span class="me-2">${client.email} - ${client.cidade || ''}/${client.estado || ''}</span>
      <button class="btn btn-sm btn-outline-danger delete-client-btn" data-client-id="${client.id}" title="Excluir cliente">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;

    clientItem.appendChild(nameDiv);
    clientItem.appendChild(detailsDiv);

    // Selecionar cliente ao clicar no item (mas não no botão de deletar)
    clientItem.addEventListener('click', (event) => {
      if (!event.target.closest('.delete-client-btn')) {
        selectClient(client, event);
      }
    });

    // Evento de deletar cliente
    detailsDiv.querySelector('.delete-client-btn').addEventListener('click', async (e) => {
      e.stopPropagation(); // Impede o clique de selecionar o cliente

      const confirmDelete = confirm(`Deseja realmente deletar o cliente "${client.nome_completo}"?`);
      if (!confirmDelete) return;

      try {
        const res = await fetch(`${API_BASE}/clientes/${client.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) throw new Error('Erro ao deletar o cliente');

        alert('Cliente deletado com sucesso!');
        loadClientList(); // Recarrega a lista após a exclusão
      } catch (error) {
        alert(`Erro: ${error.message}`);
      }
    });

    container.appendChild(clientItem);
  });

  // Reativa o filtro de busca após carregar os clientes
  const searchInput = document.getElementById('clientSearch');
  const clearBtn = document.getElementById('clearSearch');

  if (searchInput && clearBtn) {
    searchInput.removeEventListener('input', handleSearchInput);
    clearBtn.removeEventListener('click', handleClearSearch);

    searchInput.addEventListener('input', handleSearchInput);
    clearBtn.addEventListener('click', handleClearSearch);
  }

  // Remove possíveis backdrops extras
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
}

// Funções auxiliares para busca
function handleSearchInput() {
  const searchTerm = this.value.toLowerCase();
  const items = document.querySelectorAll('.client-item');

  items.forEach(item => {
    const clientName = item.querySelector('.client-name').textContent.toLowerCase();
    item.style.display = clientName.includes(searchTerm) ? 'flex' : 'none';
  });
}

function handleClearSearch() {
  const searchInput = document.getElementById('clientSearch');
  searchInput.value = '';
  document.querySelectorAll('.client-item').forEach(item => {
    item.style.display = 'flex';
  });
}

function selectClient(client, event) {
  document.querySelectorAll('.client-item').forEach(item => {
    item.classList.remove('selected');
  });

  event.currentTarget.classList.add('selected');

  window.selectedClientGlobal = client;

  const clientNameDiv = document.getElementById('clientName');
  if (clientNameDiv) {
    clientNameDiv.textContent = client.nome_completo;
  }

  console.log('👤 Cliente selecionado e info exibida:', client);

  if (selectClientModalInstance) selectClientModalInstance.hide();

  if (typeof window.carregarContratos === 'function') {
    window.carregarContratos();
  }
}

// Botão de prosseguir
document.getElementById('proceedToContractBtn').addEventListener('click', function () {
  if (selectClientModalInstance) selectClientModalInstance.hide();
});

// Botão do header para abrir modal
document.getElementById('selectContractBtn').addEventListener('click', openSelectClientModal);

//---------------- MODAL NOVO CLIENTE //----------------------

// Função para abrir o modal de novo cliente
function openNewClientModal() {
  try {
    // Resetar o formulário
    document.getElementById('newClientForm').reset();

    // Definir o título do modal
    document.getElementById('modalTitle').textContent = 'Adicionar Novo Cliente';

    // Mostrar o modal
    const modal = document.getElementById('projectModal');
    modal.style.display = 'block';

    // Adicionar máscaras aos campos
    initMasks();

  } catch (error) {
    console.error('Erro ao abrir modal de novo cliente:', error);
  }
}

// Função para fechar o modal
function closeNewClientModal() {
  document.getElementById('projectModal').style.display = 'none';
}

// Inicializar máscaras dos campos
function initMasks() {
  // Máscara para CPF (000.000.000-00)
  $('#cpf').mask('000.000.000-00', { reverse: false });

  // Máscara para telefone ((00) 00000-0000)
  $('#telefone').mask('(00) 00000-0000');

  // Máscara para CEP (00000-000)
  $('#cep').mask('00000-000');

  // Buscar endereço automático quando CEP for preenchido
  $('#cep').on('blur', function () {
    const cep = $(this).cleanVal();
    if (cep.length === 8) {
      fetchAddressByCEP(cep);
    }
  });
}

// Buscar endereço via API ViaCEP
function fetchAddressByCEP(cep) {
  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => response.json())
    .then(data => {
      if (!data.erro) {
        $('#logradouro').val(data.logradouro);
        $('#bairro').val(data.bairro);
        $('#cidade').val(data.localidade);
        $('#estado').val(data.uf);
        $('#numero_casa').focus();
      } else {
        alert('CEP não encontrado!');
      }
    })
    .catch(error => {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar endereço. Por favor, preencha manualmente.');
    });
}

function handleNewClientSubmit(event) {
  event.preventDefault();

  const token = localStorage.getItem("access_token");
  if (!token) {
    alert("Token de autenticação ausente. Faça login novamente.");
    return;
  }

  // Validar CPF
  if (!validateCPF($('#cpf').cleanVal())) {
    alert('Por favor, insira um CPF válido.');
    return;
  }

  // Validar email
  const email = $('#email').val();
  if (!validateEmail(email)) {
    alert('Por favor, insira um e-mail válido.');
    return;
  }

  // Coletar dados do formulário
  const formData = {
    nome_completo: $('#nome_completo').val(),
    email: email,
    cpf: $('#cpf').cleanVal(),
    telefone: $('#telefone').cleanVal(),
    cep: $('#cep').cleanVal(),
    logradouro: $('#logradouro').val(),
    bairro: $('#bairro').val(),
    cidade: $('#cidade').val(),
    estado: $('#estado').val(),
    numero_casa: $('#numero_casa').val(),
    complemento: $('#complemento').val()
  };

  console.log('Payload enviado:', JSON.stringify(formData, null, 2));

  fetch(`${API_BASE}/clientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(formData)
  })
    .then(async response => {
      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro detalhado do backend:', data);
        if (response.status === 401) {
          throw new Error('Não autorizado. Faça login novamente.');
        }
        throw new Error(data.detail || 'Erro ao cadastrar cliente.');
      }

      console.log('✅ Cliente cadastrado com sucesso:', data);
      alert(`Cliente ${data.nome_completo} cadastrado com sucesso!`);
      closeNewClientModal();
      loadClientList();
    })
    .catch(error => {
      console.error('Erro ao cadastrar cliente:', error);
      alert(error.message);
    });
}


// Funções de validação
function validateCPF(cpf) {
  // Implementação básica - considere usar uma validação mais robusta
  return cpf.length === 11;
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
  // Abrir modal quando clicar no botão "Novo Cliente"
  const newClientBtn = document.getElementById('addProjectBtn');
  if (newClientBtn) {
    newClientBtn.addEventListener('click', openNewClientModal);
  }

  // Fechar modal quando clicar no botão de fechar
  const closeBtn = document.querySelector('#projectModal .close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeNewClientModal);
  }

  // Fechar modal quando clicar no botão cancelar
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeNewClientModal);
  }

  // Fechar modal quando clicar fora do conteúdo
  const modal = document.getElementById('projectModal');
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeNewClientModal();
      }
    });
  }

  // Submissão do formulário
  const form = document.getElementById('newClientForm');
  if (form) {
    form.addEventListener('submit', handleNewClientSubmit);
  }
});

//---------------- MODAL CRIAR CONTRATO/PROJETO //----------------------

// Função para abrir o modal de criação de contrato
function openCreateContractModal() {
  try {
    // Resetar o formulário
    document.getElementById('createContractForm').reset();

    // Mostrar o modal
    const modal = document.getElementById('createContractModal');
    modal.style.display = 'block';

    // Inicializar máscaras e funcionalidades
    initContractMasks();

  } catch (error) {
    console.error('Erro ao abrir modal de criação de contrato:', error);
  }
}

// Função para fechar o modal
function closeCreateContractModal() {
  document.getElementById('createContractModal').style.display = 'none';
}

// Inicializar máscaras e eventos do formulário de contrato
function initContractMasks() {
  // Máscara para CEP (00000-000)
  $('#cep_contract').mask('00000-000');

  // Buscar endereço automático quando CEP for preenchido
  $('#cep_contract').on('blur', function () {
    const cep = $(this).cleanVal();
    if (cep.length === 8) {
      fetchContractAddressByCEP(cep);
    }
  });
}

// Buscar endereço via API ViaCEP para o contrato
function fetchContractAddressByCEP(cep) {
  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => response.json())
    .then(data => {
      if (!data.erro) {
        $('#logradouro_contract').val(data.logradouro);
        $('#bairro_contract').val(data.bairro);
        $('#cidade_contract').val(data.localidade);
        $('#estado_contract').val(data.uf);
        $('#numero_contract').focus();
      } else {
        alert('CEP não encontrado!');
      }
    })
    .catch(error => {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar endereço. Por favor, preencha manualmente.');
    });
}

function handleCreateContractSubmit(event) {
  event.preventDefault();

  if (!window.selectedClientGlobal) {
    alert('Selecione um cliente antes de criar o contrato.');
    return;
  }

  // Validar CEP
  const cep = $('#cep_contract').cleanVal();
  if (cep.length !== 8) {
    alert('Por favor, insira um CEP válido.');
    return;
  }

  // Coletar dados do formulário com inversores string e numero_placas inteiro
  const formData = {
    inversores: $('#inversores').val(),  // string
    numero_placas: parseInt($('#numero_placas').val()),  // inteiro
    cep: cep,
    logradouro: $('#logradouro_contract').val(),
    bairro: $('#bairro_contract').val(),
    cidade: $('#cidade_contract').val(),
    estado: $('#estado_contract').val(),
    numero: $('#numero_contract').val(),
    complemento: $('#complemento_contract').val()
  };

  // Validar numero_placas como inteiro positivo
  if (isNaN(formData.numero_placas) || formData.numero_placas <= 0) {
    alert('Informe um número válido para número de placas.');
    return;
  }

  // Validar inversores não vazio
  if (!formData.inversores) {
    alert('Informe o tipo de inversores.');
    return;
  }

  console.log('🧾 ID do cliente selecionado:', window.selectedClientGlobal);

  // URL do endpoint com cliente selecionado
  const url = `${API_BASE}/associacao/${window.selectedClientGlobal.id}/contratos`;

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(formData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Erro ao criar contrato. Tente novamente.');
    }
    return response.json();
  })
  .then(data => {
    alert('Contrato/projeto criado com sucesso!');
    closeCreateContractModal();
    console.log('Contrato criado:', data);
  })
  .catch(error => {
    alert(error.message);
    console.error('Erro:', error);
  });
}

// Event Listeners para o modal de contrato
document.addEventListener('DOMContentLoaded', function () {
  // Abrir modal quando clicar no botão "Prosseguir para Criar Contrato"
  const proceedBtn = document.getElementById('proceedToContractBtn');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', openCreateContractModal);
  }

  // Fechar modal quando clicar no botão de fechar
  const closeBtns = document.querySelectorAll('.close-create-contract');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', closeCreateContractModal);
  });

  // Fechar modal quando clicar fora do conteúdo
  const modal = document.getElementById('createContractModal');
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeCreateContractModal();
      }
    });
  }

  // Submissão do formulário
  const form = document.getElementById('createContractForm');
  if (form) {
    form.addEventListener('submit', handleCreateContractSubmit);
  }
});

//---------------- MODAL CRIAR CONTRATO/PROJETO END //----------------------

document.getElementById("logoutBtn").addEventListener("click", function () {
  // Limpa dados de sessão/localStorage (ajuste conforme seu uso)
  sessionStorage.clear();
  localStorage.clear();

  // Redireciona para a página de login (ou outra)
  window.location.href = "/login.html"; // ou o caminho da sua página de login
});
