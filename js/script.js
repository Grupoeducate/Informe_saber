// --- PROMPT MAESTRO V3.0 - SCRIPT DE LA PLATAFORMA RUTA SABER V6.0 (MULTI-PÁGINA CORREGIDO) ---

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split("/").pop();
    if (path === 'index.html' || path === '') {
        initLoginPage();
    } else if (path === 'dashboard.html') {
        initDashboardPage();
    } else if (path === 'reporte.html') {
        initReportPage();
    }
});

// --- LÓGICA DE LOGIN ---
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('user').value.trim();
    const pass = document.getElementById('pass').value.trim();
    const errorMessage = document.getElementById('error-message');
    try {
        const data = await fetchData('colegios.json');
        if (user === data.adminUser && pass === data.adminKey) {
            sessionStorage.setItem('RutaSaberUser', 'admin');
            window.location.href = 'dashboard.html';
            return;
        }
        const colegio = data.colegios.find(c => c.dane === user);
        if (colegio) {
            const generatedPass = `${user[0]}${user.slice(-1)}${user[1]}${user.slice(-2, -1)}`;
            if (pass === generatedPass) {
                sessionStorage.setItem('RutaSaberUser', colegio.dane);
                window.location.href = `reporte.html?dane=${colegio.dane}`;
                return;
            }
        }
        errorMessage.textContent = "Usuario o clave incorrectos.";
    } catch (error) {
        errorMessage.textContent = "Error del sistema. Verifique la consola.";
    }
}

// --- LÓGICA DEL DASHBOARD ---
async function initDashboardPage() {
    // ... (sin cambios, ya debería funcionar)
}

// --- LÓGICA DEL REPORTE ---
async function initReportPage() {
    const reportContainer = document.getElementById('report-content');
    const urlParams = new URLSearchParams(window.location.search);
    const dane = urlParams.get('dane');

    if (!dane) {
        reportContainer.innerHTML = "<h1>Error: DANE no especificado.</h1>";
        return;
    }

    try {
        const [colegiosData, sigmaData, piData] = await Promise.all([
            fetchData('../colegios.json'),
            fetchData(`../data/Sigma_${dane}.csv`),
            fetchData(`../data/Pi_${dane}.csv`)
        ]);

        const colegioInfo = colegiosData.colegios.find(c => c.dane === dane);
        
        // Aquí iría toda la lógica de cálculo y renderizado del informe
        reportContainer.innerHTML = `
            <header class="report-header">
                <img src="../imagenes/Logogec.png" alt="Logo">
                <h2>${colegioInfo.nombre.toUpperCase()} | Informe Directivo</h2>
            </header>
            <main>
                <section>
                    <h2 class="section-title">Informe Cargado Exitosamente</h2>
                    <p>Los datos para el colegio ${colegioInfo.nombre} (DANE: ${dane}) se han cargado. El contenido completo y los gráficos se renderizarían aquí.</p>
                </section>
            </main>
        `;

    } catch (error) {
        reportContainer.innerHTML = `<h1>Error al generar el informe</h1><p>${error.message}</p>`;
    }
}

// --- FUNCIÓN DE CARGA DE DATOS (CORREGIDA) ---
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`No se pudo cargar el archivo: ${url}`);
    if (url.endsWith('.json')) return response.json();
    if (url.endsWith('.csv')) {
        const text = await response.text();
        return new Promise(resolve => {
            Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true, complete: results => resolve(results.data) });
        });
    }
}
