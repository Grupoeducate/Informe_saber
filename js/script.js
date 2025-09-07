// --- PROMPT MAESTRO V3.0 - SCRIPT DE LA PLATAFORMA RUTA SABER V3.0 (FINAL) ---

// --- ROUTER PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split("/").pop();
    if (path === 'index.html' || path === '' || path === 'Informe_saber') {
        renderLoginPage();
    } else if (path === 'dashboard.html') {
        renderDashboardPage();
    } else if (path === 'reporte.html') {
        renderReportPage();
    }
});

// --- LÓGICA DE CARGA DE DATOS ---
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error al cargar ${url}: ${response.statusText}`);
    if (url.endsWith('.json')) return response.json();
    if (url.endsWith('.csv')) {
        const text = await response.text();
        return new Promise(resolve => {
            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data)
            });
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
    // Seguridad básica
    if (sessionStorage.getItem('RutaSaberUser') !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    try {
        const data = await fetchData('colegios.json');
        const tableBody = document.querySelector('#colegios-table tbody');
        data.colegios.sort((a, b) => a.nombre.localeCompare(b.nombre));
        let rows = '';
        data.colegios.forEach(colegio => {
            rows += `<tr>
                <td>${colegio.nombre}</td>
                <td>${colegio.dane}</td>
                <td><a href="reporte.html?dane=${colegio.dane}" class="action-btn" target="_blank">Ver Informe</a></td>
            </tr>`;
        });
        tableBody.innerHTML = rows;
    } catch (error) {
        console.error("Error al cargar colegios en el dashboard:", error);
    }
}

// --- VISTA: REPORTE PAGE (MOTOR PRINCIPAL) ---
async function renderReportPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const dane = urlParams.get('dane');
    const loggedInUser = sessionStorage.getItem('RutaSaberUser');

    // Seguridad básica
    if (!dane || (loggedInUser !== 'admin' && loggedInUser !== dane)) {
        // window.location.href = 'index.html';
        console.error("Acceso no autorizado o DANE no especificado.");
        document.getElementById('report-content').innerHTML = "<h1>Acceso Denegado</h1>";
        return;
    }

    try {
        // Cargar todos los datos en paralelo
        const [colegiosData, nivelesData, nacionalesData, sigmaData, piData] = await Promise.all([
            fetchData('colegios.json'),
            fetchData('data/niveles_icfes.json'),
            fetchData('data/promedios_nacionales.json'),
            fetchData(`data/Sigma_${dane}.csv`),
            fetchData(`data/Pi_${dane}.csv`)
        ]);

        const colegioInfo = colegiosData.colegios.find(c => c.dane === dane);
        if (!colegioInfo) throw new Error("Colegio no encontrado");

        // Procesar y calcular datos
        // (Aquí iría la lógica de cálculo que hemos definido)
        // Por simplicidad, se usarán datos pre-calculados para este ejemplo.
        const datosCalculados = {
            nombreColegio: colegioInfo.nombre.toUpperCase(),
            grupo: "11° A-JU",
            promedioGlobalInicial: 261.5,
            promedioGlobalFinal: 250.9,
            // ... más datos calculados
        };

        // Renderizar el HTML del informe
        const reportContainer = document.getElementById('report-content');
        reportContainer.innerHTML = `
            <header class="report-header">
                <img src="imagenes/Logogec.png" alt="Logo Grupo Edúcate Colombia">
                <h2>${datosCalculados.nombreColegio} | Informe Directivo</h2>
            </header>
            <nav class="report-nav">
                <a href="#resumen">Resumen</a>
                <a href="#panorama">Panorama</a>
                <a href="#areas">Áreas</a>
                <a href="#estudiantes">Estudiantes</a>
                <a href="#desglose-lc">L. Crítica</a>
            </nav>
            <main>
                <section class="cover-section">
                     <h1 class="platform-name">Ruta <span>Saber.</span></h1>
                     <h3>${datosCalculados.nombreColegio}</h3>
                     <div class="group-name" style="border-color: var(--accent-color); color: var(--accent-color);">${datosCalculados.grupo}</div>
                </section>
                <section id="resumen">
                    <h2 class="section-title">Resumen Ejecutivo</h2>
                    <p>Contenido del resumen ejecutivo...</p>
                </section>
                <section id="panorama">
                    <h2 class="section-title">Panorama General</h2>
                    <div class="grid-layout grid-1-col">
                        <div class="panel"><h4>Puntaje Global Histórico: Colegio vs. Colombia (4 Años)</h4><div class="chart-container" id="historialChart"></div></div>
                        <div class="panel"><h4>Evolución del Puntaje Global del Grupo</h4><div class="chart-container" id="evolucionChart"></div></div>
                    </div>
                </section>
                <!-- ... más secciones ... -->
            </main>
            <footer class="report-footer">Informe generado por: Dirección de Pedagogía - Marlon Galvis V.</footer>
        `;

        // Renderizar los gráficos
        renderizarGraficos(datosCalculados, nacionalesData);

    } catch (error) {
        console.error("Error fatal al generar el informe:", error);
        document.getElementById('report-content').innerHTML = `<h1>Error al generar el informe</h1><p>${error.message}</p>`;
    }
}

function renderizarGraficos(datos, nacionales) {
    // Lógica para renderizar todos los gráficos de ApexCharts
    // Ejemplo para el gráfico de evolución
    new ApexCharts(document.querySelector("#evolucionChart"), {
        series: [{ name: 'Puntaje Global', data: [datos.promedioGlobalInicial, datos.promedioGlobalFinal] }],
        chart: { type: 'line', height: 350, fontFamily: 'Barlow Condensed' },
        // ... resto de la configuración del gráfico
    }).render();

    // ... renderizar los demás gráficos
}
