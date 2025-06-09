let contratosCliente = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarCliente();       // busca nome do cliente logado
    carregarContratos();     // busca lista de contratos

    const plantSelect = document.getElementById('plantSelect');
    plantSelect.addEventListener('change', async () => {
        const selectedId = plantSelect.value;

        if (!selectedId) {
            limparDadosKit();
            return;
        }

        try {
            // Busca dados detalhados do contrato selecionado
            const contratoDetalhado = await carregarContratoDetalhado(selectedId);

            // Atualiza os dados na página
            atualizarKitAdquirido(contratoDetalhado);
            mostrarMensagemModal(contratoDetalhado);

            // Atualiza campo com CEP (ou outro identificador)
            document.getElementById('contractNumber').textContent = contratoDetalhado.cep || '';
        } catch (erro) {
            console.error('Erro ao carregar contrato detalhado:', erro);
            limparDadosKit();
        }
    });
});

async function carregarCliente() {
    try {
        const token = localStorage.getItem("access_token");

        const resposta = await fetch('https://www.sansolenergiasolar.com.br/python/cliente/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            throw new Error(`Erro ao buscar cliente: ${resposta.statusText}`);
        }

        const cliente = await resposta.json();
        document.getElementById('userName').textContent = cliente.nome_completo || 'Cliente';
    } catch (erro) {
        console.error('Erro ao carregar cliente:', erro);
        document.getElementById('userName').textContent = 'Cliente';
    }
}

async function carregarContratos() {
    try {
        const token = localStorage.getItem("access_token");

        const resposta = await fetch('https://www.sansolenergiasolar.com.br/python/meus-contratos', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            throw new Error(`Erro ao carregar contratos: ${resposta.statusText}`);
        }

        contratosCliente = await resposta.json();

        const selectElement = document.getElementById('plantSelect');
        selectElement.innerHTML = '';

        if (contratosCliente.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum contrato encontrado';
            selectElement.appendChild(option);
            limparDadosKit();
            return;
        }

        contratosCliente.forEach(contrato => {
            const option = document.createElement('option');
            option.value = contrato.id;
            option.textContent = `${contrato.cep} - ${contrato.endereco_completo}`;
            selectElement.appendChild(option);
        });

        // Dispara o evento change para preencher os dados do primeiro contrato automaticamente
        selectElement.dispatchEvent(new Event('change'));

    } catch (erro) {
        console.error('Erro ao buscar contratos:', erro);
        limparDadosKit();
    }
}

async function carregarContratoDetalhado(contratoId) {
    const token = localStorage.getItem("access_token");

    const resposta = await fetch(`https://www.sansolenergiasolar.com.br/python/meus-contratos/${contratoId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (!resposta.ok) {
        throw new Error(`Erro ao carregar contrato detalhado: ${resposta.statusText}`);
    }

    return await resposta.json();
}

function atualizarKitAdquirido(contrato) {
    document.getElementById('quantidade-placas').textContent = contrato.numero_placas ?? '0';
    document.getElementById('descricao-placas').textContent = ''; // Sem descrição no JSON

    document.getElementById('quantidade-inversores').textContent = contrato.inversores || '0 Inversores';
    document.getElementById('descricao-inversores').textContent = ''; // Sem descrição no JSON
}

function limparDadosKit() {
    document.getElementById('quantidade-placas').textContent = '0';
    document.getElementById('descricao-placas').textContent = '';
    document.getElementById('quantidade-inversores').textContent = '0';
    document.getElementById('descricao-inversores').textContent = '';
    document.getElementById('contractNumber').textContent = '';
}

// ---------------------------- STATUS DA JORNADA ------------------------------------------------

function atualizarStatusJornada(statusAtual) {
    // Ordem dos status, na sequência correta
    const ordemStatus = [
    "contrato",
    "boas-vindas",
    "kit adquirido",
    "instalação",
    "ativação",
    "concluído"
];

    // Pega todos os elementos timeline-step
    const passos = document.querySelectorAll('.timeline-step');

    // Descobre o índice do status atual na ordem
    const indiceAtual = ordemStatus.indexOf(statusAtual);

    passos.forEach((passo) => {
        const statusPasso = passo.getAttribute('data-status');

        if (indiceAtual === -1) {
            // Se status não reconhecido, remove todas as ativações
            passo.classList.remove('active');
            return;
        }

        // Se o passo está antes ou é igual ao status atual, ativa ele
        if (ordemStatus.indexOf(statusPasso) <= indiceAtual) {
            passo.classList.add('active');
        } else {
            passo.classList.remove('active');
        }
    });
}

// Agora vamos modificar o event listener do plantSelect para atualizar o status da jornada após carregar o contrato detalhado:

document.addEventListener('DOMContentLoaded', () => {
    carregarCliente();       // busca nome do cliente logado
    carregarContratos();     // busca lista de contratos

    const plantSelect = document.getElementById('plantSelect');
    plantSelect.addEventListener('change', async () => {
        const selectedId = plantSelect.value;

        if (!selectedId) {
            limparDadosKit();
            // Remove highlights se não tem contrato selecionado
            atualizarStatusJornada('');
            return;
        }

        try {
            // Busca dados detalhados do contrato selecionado
            const contratoDetalhado = await carregarContratoDetalhado(selectedId);

            // Atualiza os dados na página
            atualizarKitAdquirido(contratoDetalhado);

            // Atualiza campo com CEP (ou outro identificador)
            document.getElementById('contractNumber').textContent = contratoDetalhado.cep || '';

            // Atualiza o destaque da timeline de status conforme o status do contrato
            atualizarStatusJornada(contratoDetalhado.status);

        } catch (erro) {
            console.error('Erro ao carregar contrato detalhado:', erro);
            limparDadosKit();
            atualizarStatusJornada('');
        }
    });
});

// ---------------------- LOGOUT ------------------------------------------

document.querySelector('.logout-btn').addEventListener('click', () => {
    // Remove o token do localStorage
    localStorage.removeItem('access_token');

   const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // Ambiente local
    window.location.href = "/login.html";
  } else {
    // Ambiente produção
    window.location.href = "https://www.sansolenergiasolar.com.br/jornada/";
  }
});


function mostrarMensagemModal(contrato) {
    const historico = contrato.historico;
    if (!historico || historico.length === 0) return;

    // Pega a última atualização (índice 0)
    const ultimaAtualizacao = historico[0];
    // Usa mensagem temporária se existir, senão a final
    const mensagem = ultimaAtualizacao.mensagem_temporaria || ultimaAtualizacao.mensagem_final;
    if (!mensagem) return;

    const identificador = `mensagem-vista-${contrato.id}-${ultimaAtualizacao.data_atualizacao}`;
    if (localStorage.getItem(identificador)) return; // Já viu essa mensagem

    const modal = document.getElementById('statusModal');
    const closeBtn = document.getElementById('closeModal');
    const statusMessage = document.getElementById('statusMessage');

    if (!modal || !closeBtn || !statusMessage) {
        console.error('Elementos do modal não encontrados no DOM');
        return;
    }

    statusMessage.textContent = mensagem;
    modal.classList.remove('hidden');

    closeBtn.onclick = () => {
        modal.classList.add('hidden');
        localStorage.setItem(identificador, 'true');
    };
}

// FAQ Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const faqButton = document.getElementById('faqButton');
    const faqModal = document.getElementById('faqModal');
    const faqCloseBtn = document.querySelector('.faq-close-btn');
    
    // Open modal when FAQ button is clicked
    faqButton.addEventListener('click', function() {
        faqModal.style.display = 'block';
    });
    
    // Close modal when X is clicked
    faqCloseBtn.addEventListener('click', function() {
        faqModal.style.display = 'none';
    });
    
    // Close modal when clicking outside content
    window.addEventListener('click', function(event) {
        if (event.target === faqModal) {
            faqModal.style.display = 'none';
        }
    });
    
    // FAQ accordion functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });
});
