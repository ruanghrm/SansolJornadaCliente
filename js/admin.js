const api = window.API_BASE;
// const token = localStorage.getItem("access_token");

let clientes = [];
let contratos = [];

const statusMap = {
    "contrato": "contrato",
    "boas-vindas": "boas-vindas",
    "kit adquirido": "kit adquirido",
    "instalação": "instalação",
    "ativação": "ativação",
    "concluído": "concluído",
};

const statusToColumnIdMap = {
    "contrato": "col-contrato",
    "boas-vindas": "col-boasvindas",
    "kit adquirido": "col-kit-adquirido",
    "instalação": "col-instalacao",
    "ativação": "col-ativacao",
    "concluído": "col-concluido",
};

const statusToBadgeIdMap = {
    "contrato": "contrato-count",
    "boas-vindas": "boas-vindas-count",
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
        // alert("Erro ao carregar clientes: " + err.message);
    }
}

async function carregarContratos() {
    contratos = [];

    const clienteId = window.selectedClientGlobal?.id;

    if (!clienteId) {
        // alert("Cliente não selecionado.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/cliente/${clienteId}/contratos`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error(`Erro ao buscar contratos do cliente ${clienteId}`);
        }

        const data = await res.json();
        console.log("Dados recebidos do endpoint contratos:", data);

        const nomeCliente = window.selectedClientGlobal?.nome_completo || "Desconhecido";

        contratos = data.map(c => ({
            id: c.id,
            city: c.cidade,
            clientName: window.selectedClientGlobal?.nome_completo || "Desconhecido",
            cep: c.cep,
            numeroPlacas: c.numero_placas,
            inversores: c.inversores,
            endereco: `${c.logradouro}, ${c.numero}`, // concatena logradouro e número
            status: c.status,
        }));

        renderContratos();
        setupDragAndDrop();
        updateCounters();

        console.log("Contratos carregados para cliente:", nomeCliente, contratos);
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
    <h4 style="color: #666; margin: 0 0 4px 0; font-weight: normal; font-size: 14px;">${contract.city}</h4>
    <h2 style="margin: 0 0 8px 0; font-weight: bold; font-size: 20px; color: #222;">${contract.clientName}</h2>
    <p style="margin: 4px 0; font-size: 14px; color: #444;">CEP: <strong>${contract.cep}</strong></p>
    <p style="margin: 4px 0; font-size: 14px; color: #444;">Placas: <strong>${contract.numeroPlacas}</strong> e <strong>${contract.inversores}</strong></p>
    <p style="margin: 4px 0 12px 0; font-size: 14px; color: #444;">Endereço: <em>${contract.endereco}</em></p>
    <button class="delete-btn" title="Excluir contrato" style="background: transparent; border: none; color: #cc0000; font-size: 18px; cursor: pointer;">&times;</button>
    `;

    // Evento de arrastar
    card.addEventListener('dragstart', dragStart);

    // Botão de exclusão
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Evita conflito com drag
        const confirmDelete = confirm("Tem certeza que deseja excluir este contrato?");
        if (confirmDelete) {
            try {
                const res = await fetch(`${API_BASE}/contratos/${contract.id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    const msg = await res.text();
                    throw new Error(msg || "Erro ao deletar contrato");
                }

                // Remove da lista local e recarrega
                contratos = contratos.filter(c => c.id !== contract.id);
                renderContratos();
                updateCounters();

                alert("Contrato excluído com sucesso!");
            } catch (err) {
                alert("Erro ao excluir contrato: " + err.message);
            }
        }
    });

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
        return;
    }

    const mensagensPorStatus = {
        "contrato": "Seu contrato foi gerado e estamos iniciando o processo!",
        "boas-vindas": "Bem-vindo(a)! Estamos felizes em tê-lo conosco!",
        "kit adquirido": "Seu kit foi adquirido com sucesso! Em breve você receberá as próximas instruções.",
        "instalação": "Estamos prontos para instalar! Aguarde o agendamento.",
        "ativação": "Seu contrato está no estágio de Ativação! Parabéns!",
        "concluído": "Tudo certo! Agora seu contrato está em Garantia. Conte conosco sempre que precisar!"
    };

    const mensagemCliente = mensagensPorStatus[newStatus] || "Atualização de status concluída.";

    try {
        const res = await fetch(`${API_BASE}/contratos/${contractId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                novo_status: newStatus,
                mensagem: mensagemCliente
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

// Exportar a função globalmente (caso precise usar em outro script)
window.carregarContratos = carregarContratos;