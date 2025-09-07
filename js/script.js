// --- PROMPT MAESTRO V3.0 - SCRIPT DE LA PLATAFORMA RUTA SABER V2.0 ---

document.addEventListener('DOMContentLoaded', () => {
    // Router simple para cargar la vista correcta
    const path = window.location.pathname.split("/").pop();

    if (path === 'index.html' || path === '') {
        renderLoginPage();
    } else if (path === 'dashboard.html') {
        renderDashboardPage();
    } else if (path === 'reporte.html') {
        renderReportPage();
    }
});

// --- RENDERIZADO DE VISTAS ---

function renderLoginPage() {
    const app = document.getElementById('app-container');
    app.innerHTML = `
        <nav class="navbar">
            <div class="logo">
                <img src="imagenes/Logogec.png" alt="Grupo Edúcate Colombia">
            </div>
            <a href="#login-form" class="access-btn">Acceder</a>
        </nav>
        <main class="hero-section">
            <div class="hero-content">
                <h1 class="platform-name">Ruta <span>Saber.</span></h1>
                <p class="subtitle">
                    Accede a tus datos, enfócate en la meta. Identifica fortalezas y diseña planes de mejoramiento accionables para llevar a tu institución al siguiente nivel.
                </p>
                <form id="login-form" class="login-form">
                    <input type="text" id="user" placeholder="Código DANE o Usuario Admin" required>
                    <input type="password" id="pass" placeholder="Clave" required>
                    <button type="submit">Ingresar a mi Ruta</button>
                    <div id="error-message"></div>
                </form>
            </div>
            <div class="hero-visual">
                <img src="imagenes/fondo.png" alt="Análisis de datos educativos">
            </div>
        </main>
    `;
    setupLoginListener();
}

function renderDashboardPage() {
    // Lógica para el dashboard
}

function renderReportPage() {
    // Lógica para el reporte
}


// --- LÓGICA DE EVENTOS Y FUNCIONES ---

function setupLoginListener() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const user = document.getElementById('user').value.trim();
    const pass = document.getElementById('pass').value.trim();
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch('colegios.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        // Validar Administrador
        if (user === data.adminUser && pass === data.adminKey) {
            errorMessage.textContent = "";
            sessionStorage.setItem('RutaSaberUser', 'admin');
            window.location.href = 'dashboard.html';
            return;
        }

        // Validar Directivo
        const colegio = data.colegios.find(c => c.dane === user);
        if (colegio) {
            const generatedPass = `${user[0]}${user.slice(-1)}${user[1]}${user.slice(-2, -1)}`;
            if (pass === generatedPass) {
                errorMessage.textContent = "";
                sessionStorage.setItem('RutaSaberUser', colegio.dane);
                window.location.href = `reporte.html?dane=${colegio.dane}`;
                return;
            }
        }

        errorMessage.textContent = "Usuario o clave incorrectos.";
    } catch (error) {
        errorMessage.textContent = "Error del sistema. Verifique la consola.";
        console.error("Error en el login:", error);
    }
}
