// --- PROMPT MAESTRO V3.0 - SCRIPT DE LA PLATAFORMA RUTA SABER V6.0 (FINAL Y FUNCIONAL) ---

// --- ESTADO INICIAL DE LA APLICACIÓN ---
const AppState = {
    user: null,
    dane: null,
    isAdmin: false
};

const BASE_URL = window.location.pathname.includes('/Informe_saber/') ? '/Informe_saber/' : '/';

// --- ROUTER PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const daneInUrl = urlParams.get('dane');
    const sessionUser = sessionStorage.getItem('RutaSaberUser');

    if (daneInUrl && (sessionUser === 'admin' || sessionUser === daneInUrl)) {
        renderReportPage(daneInUrl);
    } else if (sessionUser === 'admin') {
        renderDashboardPage();
    } else {
        renderLoginPage();
    }
});

// --- LÓGICA DE CARGA DE DATOS ---
async function fetchData(url) {
    const finalUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error(`Error al cargar ${finalUrl}: ${response.statusText}`);
    if (url.endsWith('.json')) return response.json();
    if (url.endsWith('.csv')) {
        const text = await response.text();
        return new Promise(resolve => {
            Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true, complete: (results) => resolve(results.data) });
        });
    }
}

// --- LÓGICA DE LOGIN ---
async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('user').value.trim();
    const pass = document.getElementById('pass').value.trim();
    const errorMessage = document.getElementById('error-message');
    try {
        const data = await fetchData('colegios.json');
        if (user === data.adminUser && pass === data.adminKey) {
            sessionStorage.setItem('RutaSaberUser', 'admin');
            renderDashboardPage();
            return;
        }
        const colegio = data.colegios.find(c => c.dane === user);
        if (colegio) {
            const generatedPass = `${user[0]}${user.slice(-1)}${user[1]}${user.slice(-2, -1)}`;
            if (pass === generatedPass) {
                sessionStorage.setItem('RutaSaberUser', colegio.dane);
                window.location.href = `?dane=${colegio.dane}`; // Recarga la página con el parámetro DANE
                return;
            }
        }
        errorMessage.textContent = "Usuario o clave incorrectos.";
    } catch (error) {
        errorMessage.textContent = "Error del sistema. Verifique la consola.";
        console.error("Error en el login:", error);
    }
}

// --- RENDERIZADORES DE VISTAS ---
function renderLoginPage() {
    const app = document.getElementById('app-container');
    app.innerHTML = `
        <nav class="navbar">
            <div class="logo"><img src="imagenes/Logogec.png" alt="Grupo Edúcate Colombia"></div>
            <a href="#login-form" class="access-btn">Acceder</a>
        </nav>
        <main class="hero-section">
            <div class="hero-content">
                <h1 class="platform-name">Ruta <span>Saber.</span></h1>
                <p class="subtitle">Accede a tus datos, enfócate en la meta. Identifica fortalezas y diseña planes de mejoramiento accionables para llevar a tu institución al siguiente nivel.</p>
                <form id="login-form" class="login-form">
                    <input type="text" id="user" placeholder="Código DANE o Usuario Admin" required>
                    <input type="password" id="pass" placeholder="Clave" required>
                    <button type="submit">Ingresar a mi Ruta</button>
                    <div id="error-message"></div>
                </form>
            </div>
            <div class="hero-visual"><img src="imagenes/fondo.png" alt="Análisis de datos educativos"></div>
        </main>`;
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

async function renderDashboardPage() {
    const app = document.getElementById('app-container');
    app.innerHTML = `
        <header class="report-header">
            <img src="imagenes/Logogec.png" alt="Logo">
            <h2>Dashboard de Administración</h2>
        </header>
        <main class="dashboard-container">
            <h1 class="section-title">Colegios Registrados</h1>
            <div class="table-container">
                <table id="colegios-table">
                    <thead><tr><th>Nombre del Colegio</th><th>Código DANE</th><th>Acción</th></tr></thead>
                    <tbody></tbody>
                </table>
            </div>
        </main>`;
    try {
        const data = await fetchData('colegios.json');
        const tableBody = document.querySelector('#colegios-table tbody');
        data.colegios.sort((a, b) => a.nombre.localeCompare(b.nombre));
        let rows = '';
        data.colegios.forEach(colegio => {
            rows += `<tr>
                <td>${colegio.nombre}</td>
                <td>${colegio.dane}</td>
                <td><a href="?dane=${colegio.dane}" class="action-btn" target="_blank">Ver Informe</a></td>
            </tr>`;
        });
        tableBody.innerHTML = rows;
    } catch (error) {
        console.error("Error al cargar colegios en el dashboard:", error);
    }
}

async function renderReportPage(dane) {
    const app = document.getElementById('app-container');
    app.innerHTML = `<div class="loading-screen"><h1>Cargando y procesando datos del informe...</h1></div>`;

    try {
        const [colegiosData, nivelesData, nacionalesData, sigmaData, piData] = await Promise.all([
            fetchData('colegios.json'),
            fetchData('data/niveles_icfes.json'),
            fetchData('data/promedios_nacionales.json'),
            fetchData(`data/Sigma_${dane}.csv`),
            fetchData(`data/Pi_${dane}.csv`)
        ]);

        const colegioInfo = colegiosData.colegios.find(c => c.dane === dane);
        if (!colegioInfo) throw new Error("Colegio no encontrado");

        const promedios = (data, fields) => fields.reduce((acc, field) => ({ ...acc, [field]: data.reduce((sum, row) => sum + (row[field] || 0), 0) / data.length }), {});
        const areas = ['PUNTAJE_GLOBAL', 'LECTURA_CRITICA', 'MATEMATICAS', 'SOCIALES_CIUDADANAS', 'CIENCIAS_NATURALES', 'INGLES'];
        const promediosSigma = promedios(sigmaData, areas);
        const promediosPi = promedios(piData, areas);

        app.innerHTML = `
            <header class="report-header"><img src="imagenes/Logogec.png" alt="Logo"><h2>${colegioInfo.nombre.toUpperCase()} | Informe Directivo</h2></header>
            <nav class="report-nav"><a href="#resumen">Resumen</a><a href="#panorama">Panorama</a></nav>
            <main>
                <section id="resumen"><h2 class="section-title">Resumen Ejecutivo</h2>
                    <div class="grid-layout grid-2-cols">
                        <div class="summary-box"><h3>Evolución General</h3><p>El grupo muestra una evolución de <strong class="${(promediosPi.PUNTAJE_GLOBAL - promediosSigma.PUNTAJE_GLOBAL) >= 0 ? 'evo-pos' : 'evo-neg'}">${(promediosPi.PUNTAJE_GLOBAL - promediosSigma.PUNTAJE_GLOBAL).toFixed(1)} puntos</strong>.</p></div>
                        <div class="summary-box"><h3>Puntaje Final</h3><p>El puntaje global final fue de <strong>${promediosPi.PUNTAJE_GLOBAL.toFixed(1)}</strong>, comparado con el promedio nacional (Cal. A) de ${nacionalesData.promedios['2024'].calendario_a.global}.</p></div>
                    </div>
                </section>
                <section id="panorama"><h2 class="section-title">Panorama General</h2>
                    <div class="grid-layout grid-1-col">
                        <div class="panel"><h4>Evolución del Puntaje Global del Grupo</h4><div class="chart-container" id="evolucionChart"></div></div>
                    </div>
                </section>
            </main>
            <footer class="report-footer">Informe generado por: Dirección de Pedagogía - Marlon Galvis V.</footer>`;

        new ApexCharts(document.querySelector("#evolucionChart"), {
            series: [{ name: 'Puntaje Global', data: [promediosSigma.PUNTAJE_GLOBAL.toFixed(1), promediosPi.PUNTAJE_GLOBAL.toFixed(1)] }],
            chart: { type: 'line', height: 350, fontFamily: 'Barlow Condensed', toolbar: { show: false } },
            stroke: { curve: 'smooth', width: 4 }, markers: { size: 6 },
            dataLabels: { enabled: true },
            xaxis: { categories: ['Prueba Inicial (Sigma)', 'Prueba Final (PI)'] },
            yaxis: { title: { text: 'Puntaje Global' } },
            annotations: { yaxis: [{ y: nacionalesData.promedios['2024'].calendario_a.global, borderColor: '#fd7e14', label: { text: `Prom. Nal. Cal A 2024: ${nacionalesData.promedios['2024'].calendario_a.global}` } }] },
            colors: [getComputedStyle(document.documentElement).getPropertyValue('--accent-color')]
        }).render();

    } catch (error) {
        console.error("Error fatal al generar el informe:", error);
        app.innerHTML = `<h1>Error al generar el informe</h1><p>${error.message}</p>`;
    }
}
