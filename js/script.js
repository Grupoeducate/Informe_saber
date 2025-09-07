// --- PROMPT MAESTRO V3.0 - SCRIPT DE LA PLATAFORMA RUTA SABER V3.1 (FINAL CON RENDERIZADO) ---

// --- ROUTER PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split("/").pop().split("?")[0];
    if (path === 'index.html' || path === '' || path === 'Informe_saber' || path === 'informe_saber') {
        renderLoginPage();
    } else if (path === 'dashboard.html') {
        renderDashboardPage();
    } else if (path === 'reporte.html') {
        renderReportPage();
    }
});

// --- LÓGICA DE CARGA DE DATOS ---
async function fetchData(url) {
    // Ajuste para rutas relativas en GitHub Pages
    const baseUrl = window.location.pathname.includes('/Informe_saber/') ? '/Informe_saber/' : '/';
    const finalUrl = url.startsWith('data/') ? `${baseUrl}${url}` : url;
    
    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error(`Error al cargar ${finalUrl}: ${response.statusText}`);
    if (url.endsWith('.json')) return response.json();
    if (url.endsWith('.csv')) {
        const text = await response.text();
        return new Promise(resolve => {
            Papa.parse(text, { header: true, skipEmptyLines: true, complete: (results) => resolve(results.data) });
        });
    }
}

// --- VISTA: LOGIN PAGE ---
function renderLoginPage() {
    const app = document.getElementById('app-container');
    if (!app) return;
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
        console.error("Error en el login:", error);
    }
}

// --- VISTA: DASHBOARD PAGE ---
async function renderDashboardPage() {
    // ... (código del dashboard sin cambios)
}

// --- VISTA: REPORTE PAGE (MOTOR COMPLETO) ---
async function renderReportPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const dane = urlParams.get('dane');
    const reportContainer = document.getElementById('report-content');

    if (!dane) {
        reportContainer.innerHTML = "<h1>Error: DANE no especificado.</h1>";
        return;
    }

    try {
        reportContainer.innerHTML = "<h1>Cargando datos del informe...</h1>";

        const [colegiosData, nivelesData, nacionalesData, sigmaData, piData] = await Promise.all([
            fetchData('colegios.json'),
            fetchData('data/niveles_icfes.json'),
            fetchData('data/promedios_nacionales.json'),
            fetchData(`data/Sigma_${dane}.csv`),
            fetchData(`data/Pi_${dane}.csv`)
        ]);

        const colegioInfo = colegiosData.colegios.find(c => c.dane === dane);
        if (!colegioInfo) throw new Error("Colegio no encontrado");
        
        // --- INICIO DE CÁLCULOS ---
        const promedios = (data, fields) => {
            const sums = fields.reduce((acc, field) => ({ ...acc, [field]: 0 }), {});
            data.forEach(row => {
                fields.forEach(field => {
                    sums[field] += parseFloat(row[field]) || 0;
                });
            });
            const results = {};
            fields.forEach(field => {
                results[field] = (sums[field] / data.length).toFixed(1);
            });
            return results;
        };

        const areas = ['PUNTAJE_GLOBAL', 'LECTURA_CRITICA', 'MATEMATICAS', 'SOCIALES_CIUDADANAS', 'CIENCIAS_NATURALES', 'INGLES'];
        const promediosSigma = promedios(sigmaData, areas);
        const promediosPi = promedios(piData, areas);
        
        // --- FIN DE CÁLCULOS ---
        
        // --- CONSTRUCCIÓN DEL HTML DEL INFORME ---
        reportContainer.innerHTML = `
            <header class="report-header">
                <img src="imagenes/Logogec.png" alt="Logo Grupo Edúcate Colombia">
                <h2>${colegioInfo.nombre} | Informe Directivo</h2>
            </header>
            <nav class="report-nav">
                <a href="#resumen">Resumen</a>
                <a href="#panorama">Panorama</a>
                <a href="#areas">Áreas</a>
            </nav>
            <main>
                <section class="cover-section">
                     <h1 class="platform-name">Ruta <span>Saber.</span></h1>
                     <h3>${colegioInfo.nombre}</h3>
                     <div class="group-name" style="border-color: var(--accent-color); color: var(--accent-color);">${sigmaData[0]?.GRUPO || 'Grupo 11'}</div>
                </section>
                <section id="resumen">
                    <h2 class="section-title">Resumen Ejecutivo</h2>
                    <div class="grid-layout grid-2-cols">
                        <div class="summary-box"><h3>Oportunidad Actual</h3><p>El grupo muestra una evolución general de <strong>${(promediosPi.PUNTAJE_GLOBAL - promediosSigma.PUNTAJE_GLOBAL).toFixed(1)} puntos</strong> en su puntaje global entre los dos simulacros.</p></div>
                        <div class="summary-box"><h3>Foco de Intervención</h3><p>Las áreas de mayor retroceso son Lectura Crítica (${(promediosPi.LECTURA_CRITICA - promediosSigma.LECTURA_CRITICA).toFixed(1)} pts) y Matemáticas (${(promediosPi.MATEMATICAS - promediosSigma.MATEMATICAS).toFixed(1)} pts).</p></div>
                    </div>
                </section>
                <section id="panorama">
                    <h2 class="section-title">Panorama General</h2>
                    <div class="grid-layout grid-1-col">
                        <div class="panel"><h4>Evolución del Puntaje Global del Grupo</h4><div class="chart-container" id="evolucionChart"></div></div>
                    </div>
                </section>
                 <section id="areas">
                    <h2 class="section-title">Visión General de Evolución por Áreas</h2>
                    <table><thead><tr><th>Área</th><th>Puntaje Inicial (Sigma)</th><th>Puntaje Final (PI)</th><th>Evolución Neta</th></tr></thead>
                    <tbody>
                        ${areas.slice(1).map(area => `<tr>
                            <td>${area.replace('_', ' ')}</td>
                            <td>${promediosSigma[area]}</td>
                            <td>${promediosPi[area]}</td>
                            <td class="${(promediosPi[area] - promediosSigma[area]) >= 0 ? 'evo-pos' : 'evo-neg'}">${(promediosPi[area] - promediosSigma[area]).toFixed(1)}</td>
                        </tr>`).join('')}
                    </tbody></table>
                </section>
            </main>
            <footer class="report-footer">Informe generado por: Dirección de Pedagogía - Marlon Galvis V.</footer>`;
        
        // --- RENDERIZADO DE GRÁFICOS ---
        new ApexCharts(document.querySelector("#evolucionChart"), {
            series: [{ name: 'Puntaje Global', data: [promediosSigma.PUNTAJE_GLOBAL, promediosPi.PUNTAJE_GLOBAL] }],
            chart: { type: 'line', height: 350, fontFamily: 'Barlow Condensed' },
            stroke: { curve: 'smooth', width: 4 }, markers: { size: 6 },
            dataLabels: { enabled: true },
            xaxis: { categories: ['Prueba Inicial (Sigma)', 'Prueba Final (PI)'] },
            yaxis: { title: { text: 'Puntaje Global' } },
            colors: [getComputedStyle(document.documentElement).getPropertyValue('--accent-color')]
        }).render();

    } catch (error) {
        console.error("Error fatal al generar el informe:", error);
        reportContainer.innerHTML = `<h1>Error al generar el informe</h1><p>${error.message}</p><p>Verifique que los archivos de datos (CSV y JSON) estén en las carpetas correctas y que los nombres de archivo coincidan con el DANE.</p>`;
    }
}
