const API_BASE_URL = 'http://34.121.218.11:7200';

function getToken() {
    const token = localStorage.getItem('access_token');
    console.log('Token obtido do localStorage:', token);
    return token;
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        const parsed = JSON.parse(jsonPayload);
        console.log('Payload do token decodificado:', parsed);
        return parsed;
    } catch (error) {
        console.error('Erro ao decodificar token JWT:', error);
        return null;
    }
}

async function fetchNomeCliente() {
  const token = getToken();
  if (!token) {
    console.error('Token não encontrado.');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/meus-contratos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      console.error('Erro ao buscar contratos:', response.statusText);
      return null;
    }

    const contratos = await response.json();
    console.log('Contratos recebidos (JSON completo):', JSON.stringify(contratos, null, 2));

    // Função auxiliar para tentar extrair nome de um objeto
    function extrairNome(obj) {
      if (!obj || typeof obj !== 'object') return null;
      const keysNome = ['nome', 'nome_completo', 'cliente_nome', 'nomeCliente'];

      for (const key of keysNome) {
        if (obj[key] && typeof obj[key] === 'string') {
          return obj[key];
        }
      }
      return null;
    }

    for (const contrato of contratos) {
      // Primeiro, tenta encontrar um objeto 'cliente' dentro do contrato
      if (contrato.cliente) {
        const nome = extrairNome(contrato.cliente);
        if (nome) {
          console.log('Nome do cliente encontrado em contrato.cliente:', nome);
          return nome;
        }
      }

      // Se não achou, tenta extrair direto do contrato (alguns contratos têm o nome direto)
      const nome = extrairNome(contrato);
      if (nome) {
        console.log('Nome do cliente encontrado direto no contrato:', nome);
        return nome;
      }

      // Por último, procura qualquer string no contrato que contenha 'nome'
      for (const key in contrato) {
        if (
          typeof contrato[key] === 'string' &&
          key.toLowerCase().includes('nome')
        ) {
          console.log('Possível campo nome encontrado:', key, contrato[key]);
          return contrato[key];
        }
      }
    }

    console.warn('Nenhum campo nome encontrado nos contratos.');
    return null;

  } catch (error) {
    console.error('Erro na requisição:', error);
    return null;
  }
}

async function fetchContratos() {
    const token = getToken();

    if (!token) {
        console.error('Token não encontrado. Usuário não autenticado.');
        return [];
    }

    try {
        const response = await fetch(`${API_BASE_URL}/meus-contratos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Resposta da requisição de contratos:', response);
        if (!response.ok) {
            console.error('Erro na requisição de contratos:', response.statusText);
            return [];
        }

        const contratos = await response.json();
        console.log('Contratos recebidos:', contratos);
        return contratos;

    } catch (error) {
        console.error('Erro ao buscar contratos:', error);
        return [];
    }
}

async function popularSelectContratos(selectId) {
    const select = document.getElementById(selectId);

    if (!select) {
        console.error(`Elemento com id "${selectId}" não encontrado.`);
        return;
    }

    // Buscar e exibir nome do cliente no header (exemplo)
    const nomeCliente = await fetchNomeCliente();
    if (nomeCliente) {
        console.log('Nome do cliente para exibir no header:', nomeCliente);
        const headerNome = document.getElementById('header-nome-cliente');
        if (headerNome) {
            headerNome.textContent = `Olá, ${nomeCliente}`;
        }
    } else {
        console.warn('Nome do cliente não pôde ser obtido.');
    }

    const contratos = await fetchContratos();

    if (contratos.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Nenhum contrato disponível';
        select.appendChild(option);
        return;
    }

    select.innerHTML = '';

    contratos.forEach(contrato => {
        const option = document.createElement('option');
        option.value = contrato.id; // adapte para o campo correto
        option.textContent = contrato.nome || contrato.descricao || `Contrato ${contrato.id}`;
        select.appendChild(option);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando...');
    popularSelectContratos('plantSelect');
});
