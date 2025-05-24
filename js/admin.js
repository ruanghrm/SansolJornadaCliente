document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = "https://www.sansolenergiasolar.com.br/python";
  const token = localStorage.getItem("access_token"); // confere se está correto

  let clientes = [];
  let contratos = [];

  const statusMap = {
    "contrato": "contrato",
    "kit adquirido": "kit adquirido",
    "instalação": "instalação",
    "ativação": "ativação",
    "concluído": "concluído",
  };

  const statusToColumnIdMap = {
    "contrato": "col-contrato",
    "kit adquirido": "col-kit-adquirido",
    "instalação": "col-instalacao",
    "ativação": "col-ativacao",
    "concluído": "col-concluido",
  };

  const statusToBadgeIdMap = {
    "contrato": "contrato-count",
    "kit adquirido": "kit-adquirido-count",
    "instalação": "instalacao-count",
    "ativação": "ativacao-count",
    "concluído": "concluido-count",
  };

  function normalizeStatus(status) {
    return status.trim().toLowerCase();
  }

  function mapStatusToId(status) {
    const normalizedStatus = normalizeStatus(status);
    return statusToColumnIdMap[normalizedStatus] || null;
  }

  async function init() {
    await carregarClientes();
    await carregarContratos();
  }

  init();

  async function carregarClientes() {
    try {
      const res = await fetch(`${API_BASE}/clientes/?skip=0&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro ao buscar clientes");

      const data = await res.json();
      clientes = data.map(c => ({
        id: c.id,
        nome_completo: c.nome_completo
      }));
      console.log("Clientes carregados (apenas id e nome):", clientes);
    } catch (err) {
      alert("Erro ao carregar clientes: " + err.message);
    }
  }

  async function carregarContratos() {
  try {
    const res = await fetch(`${API_BASE}/admin/contratos`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Erro ao buscar contratos");
    
    const data = await res.json();
    console.log("Contratos recebidos da API:", data); // debug: verificar contratos "fantasmas"

    contratos = data
      .filter(c => c.cliente_id && c.status && c.tipo_kit) // só contratos válidos
      .map(c => {
        const clienteObj = clientes.find(cl => cl.id === c.cliente_id);
        if (!clienteObj) return null; // ignora contratos sem cliente correspondente
        return {
          id: c.id,
          contractNumber: `CT${c.id.substring(0, 8)}`,
          clientName: clienteObj.nome_completo,
          status: c.status,
          details: c.tipo_kit || "Kit não especificado",
          lastUpdated: c.data_ultima_atualizacao || new Date().toISOString()
        };
      })
      .filter(Boolean); // remove itens nulos (caso clienteObj seja null)

    console.log("Contratos válidos carregados para render:", contratos);

    renderContratos();
    setupDragAndDrop();
    updateCounters();

  } catch (err) {
    alert("Erro ao carregar contratos: " + err.message);
  }
}


  function createContractCard(contract) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.projectId = contract.id;
    card.draggable = true;

    card.innerHTML = `
      <span class="contract-number">${contract.contractNumber}</span>
      <h3>${contract.clientName}</h3>
      <p>${contract.details}</p>
      <p><small>Última atualização: ${formatDate(contract.lastUpdated)}</small></p>
    `;

    card.addEventListener('dragstart', dragStart);
    return card;
  }

  function renderContratos() {
  document.querySelectorAll('.project-list').forEach(list => list.innerHTML = '');

  contratos
    .filter(contract => contract.id && contract.status && statusToColumnIdMap[normalizeStatus(contract.status)])
    .forEach(contract => {
      const columnId = mapStatusToId(contract.status);
      const column = document.getElementById(columnId);
      if (column) {
        column.appendChild(createContractCard(contract));
      }
    });
}

  function setupDragAndDrop() {
    document.querySelectorAll('.project-card').forEach(c => c.addEventListener('dragstart', dragStart));
    document.querySelectorAll('.kanban-column').forEach(col => {
      col.addEventListener('dragover', e => e.preventDefault());
      col.addEventListener('dragenter', e => e.preventDefault());
      col.addEventListener('dragleave', e => e.currentTarget.classList.remove('drag-over'));
      col.addEventListener('drop', drop);
    });
  }

  function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.projectId);
  }

  async function drop(e) {
    e.preventDefault();

    const contractId = e.dataTransfer.getData('text/plain');
    const rawStatus = e.currentTarget.dataset.status;

    const rawStatusNormalized = normalizeStatus(rawStatus);
    const newStatus = statusMap[rawStatusNormalized];

    if (!newStatus) {
      alert("Status inválido: " + rawStatus);
      return;
    }

    const contrato = contratos.find(c => c.id === contractId);

    if (!contrato) {
      console.error(`Contrato com ID ${contractId} não encontrado.`);
      return;
    }

    if (contrato.status === newStatus) {
      return; // já está no status correto
    }

    try {
      const res = await fetch(`${API_BASE}/contratos/${contractId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          novo_status: newStatus,
          mensagem: `Contrato movido manualmente no painel`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`Erro ao atualizar status: ${JSON.stringify(data.detail || data)}`);
        throw new Error(data.message || "Erro ao atualizar status");
      }

      await carregarContratos();

    } catch (err) {
      alert("Erro no fetch PUT: " + err.message);
    }
  }

  function updateCounters() {
    Object.entries(statusToBadgeIdMap).forEach(([status, badgeId]) => {
      const count = contratos.filter(c => normalizeStatus(c.status) === normalizeStatus(status)).length;
      const badge = document.getElementById(badgeId);
      if (badge) badge.textContent = count;
    });
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }
});
