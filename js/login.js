document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("password").value.trim();

    if (!email || !senha) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      // Tenta login como admin primeiro
      const adminForm = new URLSearchParams();
      adminForm.append("email", email);
      adminForm.append("senha", senha);

      const adminResponse = await fetch("https://www.sansolenergiasolar.com.br/python/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: adminForm.toString(),
      });

      if (!adminResponse.ok) throw new Error("Login admin falhou");

      const adminData = await adminResponse.json();

      if (adminData.role?.toLowerCase() === "admin") {
        localStorage.setItem("access_token", adminData.access_token);
        localStorage.setItem("user_id", adminData.user_id);
        localStorage.setItem("role", "admin");
        window.location.href = "admin.html";
      } else {
        alert("Usuário admin não autorizado.");
      }
    } catch (adminError) {
      try {
        const clienteForm = new URLSearchParams();
        clienteForm.append("login", email);
        clienteForm.append("senha", senha);

        const clienteResponse = await fetch("https://www.sansolenergiasolar.com.br/python/cliente/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: clienteForm.toString(),
        });

        if (!clienteResponse.ok) throw new Error("Login cliente falhou");

        const clienteData = await clienteResponse.json();

        localStorage.setItem("access_token", clienteData.access_token);
        localStorage.setItem("user_id", clienteData.cliente_id);
        localStorage.setItem("role", "cliente");
        window.location.href = "user.html";
      } catch (clienteError) {
        alert("E-mail ou senha incorretos.");
      }
    }
  });
});
