document.addEventListener('DOMContentLoaded', () => {
  // Botões
  const addProjectBtn = document.getElementById('addProjectBtn'); // Novo Cliente
  const addClientBtn = document.getElementById('openNewProjectModalBtn');   // Novo Projeto
  const logoutBtn = document.getElementById('logoutBtn');

  // Modais
  const projectModal = document.getElementById('projectModal');
  const newProjectModal = document.getElementById('newProjectModal');

  // Fechar modais ao clicar no "x" ou cancelar
  function setupModalClose(modal) {
    modal.querySelectorAll('.close-btn, .btn-cancel').forEach(el => {
      el.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    });
  }

  setupModalClose(projectModal);
  setupModalClose(newProjectModal);

  // Abrir modal de Novo Cliente
  addProjectBtn.addEventListener('click', () => {
    projectModal.style.display = 'block';
  });

  // Abrir modal de Novo Projeto
  addClientBtn.addEventListener('click', () => {
    newProjectModal.style.display = 'block';
  });

  // Logout e redirecionamento para login.html
  logoutBtn.addEventListener('click', () => {
    // Se quiser limpar session/local storage, faça aqui
    window.location.href = 'login.html';
  });

  // Fechar modais clicando fora da área do conteúdo
  window.addEventListener('click', (event) => {
    if (event.target === projectModal) {
      projectModal.style.display = 'none';
    }
    if (event.target === newProjectModal) {
      newProjectModal.style.display = 'none';
    }
  });
});
