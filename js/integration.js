let token; // Variável global
const API_BASE = 'http://34.121.218.11:7200';

document.addEventListener('DOMContentLoaded', function () {
    // Modal e form do cliente/projeto
    const newProjectForm = document.getElementById('newProjectForm');
    const newProjectModal = document.getElementById('newProjectModal');
    const openNewProjectModalBtn = document.getElementById('openNewProjectModalBtn');
    const closeNewProjectBtns = document.querySelectorAll('.close-new-project');

    // Modal e form do contrato
    const createContractModal = document.getElementById('createContractModal');
    const createContractForm = document.getElementById('createContractForm');
    const closeCreateContractBtns = document.querySelectorAll('.close-create-contract');

    // Modal e form do novo cliente
    const newClientModal = document.getElementById('newClientModal');
    const newClientForm = document.getElementById('newClientForm');
    const openNewClientModalBtn = document.getElementById('openNewClientModalBtn'); // botão para abrir modal cliente
    const closeNewClientBtns = document.querySelectorAll('.close-new-client');

    token = localStorage.getItem('access_token');

    let projetoTemporario = null; // Guarda o projeto temporário com cliente selecionado

    // Abrir modal do novo projeto (seleção cliente)
    if (openNewProjectModalBtn) {
        openNewProjectModalBtn.addEventListener('click', () => {
            if (newProjectModal) {
                newProjectModal.style.display = 'block';
            }
            carregarClientesNoSelect();
        });
    }

    // Fechar modal novo projeto
    if (closeNewProjectBtns.length > 0) {
        closeNewProjectBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (newProjectModal) {
                    newProjectModal.style.display = 'none';
                }
                if (newProjectForm) {
                    newProjectForm.reset();
                }
            });
        });
    }

    // Fechar modal criar contrato
    if (closeCreateContractBtns.length > 0) {
        closeCreateContractBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (createContractModal) {
                    createContractModal.style.display = 'none';
                }
                if (createContractForm) {
                    createContractForm.reset();
                }
                projetoTemporario = null;
            });
        });
    }

    // Abrir modal novo cliente
    if (openNewClientModalBtn) {
        openNewClientModalBtn.addEventListener('click', () => {
            if (newClientModal) {
                newClientModal.style.display = 'block';
            }
        });
    }

    // Fechar modal novo cliente
    if (closeNewClientBtns.length > 0) {
        closeNewClientBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (newClientModal) {
                    newClientModal.style.display = 'none';
                }
                if (newClientForm) {
                    newClientForm.reset();
                }
            });
        });
    }

    // SUBMISSÃO do form novo cliente (envia para backend)
    if (newClientForm) {
        newClientForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            await criarCliente();
        });
    }

    // SUBMISSÃO do form novo projeto (só abre modal contrato)
    if (newProjectForm) {
        newProjectForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const clienteSelect = document.getElementById('clienteSelect');
            const clienteId = clienteSelect ? clienteSelect.value : null;
            if (!clienteId) {
                alert('Por favor, selecione um cliente.');
                return;
            }

            // Guarda temporariamente o cliente_id no objeto do projeto
            projetoTemporario = { cliente_id: clienteId };

            // Fecha modal seleção cliente e abre modal contrato
            if (newProjectModal) {
                newProjectModal.style.display = 'none';
            }
            newProjectForm.reset();

            if (createContractModal) {
                createContractModal.style.display = 'block';
            }
        });
    }

    // SUBMISSÃO do form criar contrato (aqui sim envia pro backend)
    if (createContractForm) {
        createContractForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            if (!projetoTemporario) {
                alert('Erro interno: projeto não encontrado. Por favor, recomece.');
                if (createContractModal) createContractModal.style.display = 'none';
                createContractForm.reset();
                return;
            }

            const cliente_id = projetoTemporario.cliente_id;

            // Monta os dados do contrato, removendo o cliente_id do corpo da requisição
            const contratoData = {
                tipo_kit: document.getElementById('tipo_kit')?.value || '',
                cep: document.getElementById('cep_contract')?.value || '',
                logradouro: document.getElementById('logradouro_contract')?.value || '',
                bairro: document.getElementById('bairro_contract')?.value || '',
                cidade: document.getElementById('cidade_contract')?.value || '',
                estado: document.getElementById('estado_contract')?.value || '',
                numero: document.getElementById('numero_contract')?.value || '',
                complemento: document.getElementById('complemento_contract')?.value || ''
            };

            try {
                const response = await fetch(`${API_BASE}/clientes/${cliente_id}/contratos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(contratoData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    console.error('Erro ao salvar projeto:', error);
                    alert(`Erro: ${error.detail || 'Falha ao salvar projeto'}`);
                    return;
                }

                const result = await response.json();
                console.log('Projeto salvo com sucesso:', result);

                alert('Projeto criado com sucesso!');
                if (createContractModal) {
                    createContractModal.style.display = 'none';
                }
                createContractForm.reset();
                projetoTemporario = null;

                // Se houver, chame função para atualizar a interface após criação
                // atualizarKanban();

            } catch (error) {
                console.error('Erro de requisição:', error);
                alert('Erro de conexão com o servidor');
            }
        });
    }
});

// Função para carregar clientes no select do modal novo projeto
async function carregarClientesNoSelect() {
    try {
        const res = await fetch(`${API_BASE}/clientes/?skip=0&limit=100`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Erro ao buscar clientes");

        const data = await res.json();

        const select = document.getElementById("clienteSelect");
        if (!select) return;

        select.innerHTML = '';

        if (data.length === 0) {
            select.innerHTML = '<option value="">Nenhum cliente encontrado</option>';
            return;
        }

        data.forEach(cliente => {
            const option = document.createElement("option");
            option.value = cliente.id;
            option.textContent = cliente.nome_completo;
            select.appendChild(option);
        });

    } catch (err) {
        console.error("Erro ao carregar clientes no modal:", err.message);
        const select = document.getElementById("clienteSelect");
        if (select) {
            select.innerHTML = '<option value="">Erro ao carregar clientes</option>';
        }
    }
}

// Função para criar cliente no backend via POST
async function criarCliente() {
  const nomeCompleto = document.getElementById('nome_completo')?.value.trim() || '';
  const email = document.getElementById('email')?.value.trim() || '';
  const cpf = document.getElementById('cpf')?.value.trim() || '';
  const telefone = document.getElementById('telefone')?.value.trim() || '';
  const cep = document.getElementById('cep')?.value.trim() || '';
  const logradouro = document.getElementById('logradouro')?.value.trim() || '';
  const bairro = document.getElementById('bairro')?.value.trim() || '';
  const cidade = document.getElementById('cidade')?.value.trim() || '';
  const estado = document.getElementById('estado')?.value.trim() || '';
  const numeroCasa = document.getElementById('numero_casa')?.value.trim() || '';
  const complemento = document.getElementById('complemento')?.value.trim() || '';

  // Validação simples
  if (!nomeCompleto || !email || !cpf || !telefone) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  const clienteData = {
    nome_completo: nomeCompleto,
    email: email,
    cpf: cpf,
    telefone: telefone,
    cep: cep,
    logradouro: logradouro,
    bairro: bairro,
    cidade: cidade,
    estado: estado,
    numero_casa: numeroCasa,
    complemento: complemento
  };

  console.log('Enviando dados do cliente:', clienteData);
  console.log('Token:', token);

  try {
    const response = await fetch(`${API_BASE}/clientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(clienteData)
    });

    console.log('Resposta HTTP:', response.status, response.statusText);

    const jsonResponse = await response.json();
    console.log('Resposta JSON:', jsonResponse);

    if (!response.ok) {
      jsonResponse.detail?.forEach(err => {
        console.error(`Erro: ${err.msg} em ${err.loc.join('.')}`);
      });

      alert(`Erro ao criar cliente: ${jsonResponse.detail?.map(e => e.msg).join(', ') || 'Erro desconhecido'}`);
      return;
    }

    alert('Cliente criado com sucesso!');
    document.getElementById('projectModal').style.display = 'none';
    document.getElementById('newClientForm').reset();
    await carregarClientesNoSelect();

  } catch (error) {
    console.error('Erro de conexão:', error);
    alert('Erro de conexão com o servidor');
  }
}
