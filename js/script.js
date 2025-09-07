// --- PROMPT MAESTRO V3.0 - SCRIPT DE LA PLATAFORMA RUTA SABER V8.0 (FINAL Y FUNCIONAL) ---

// --- ROUTER PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split("/").pop().split("?")[0];
    const validPaths = ['index.html', '', 'Informe_saber', 'informe_saber', '/'];
    if (validPaths.includes(path)) {
        renderLoginPage();
    } else if (path === 'dashboard.html') {
        renderDashboardPage();
    } else if (path === 'reporte.html') {
        renderReportPage();
    }
});

// VERSIÓN NUEVA (CORRECTA Y DEFINITIVA)
async function fetchData(url) {
    // La ruta base del repositorio en GitHub Pages es el nombre del repositorio.
    const baseUrl = "/Informe_saber"; 
    const finalUrl = `${baseUrl}/${url}`;
    
    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error(`Error al cargar ${finalUrl}: ${response.status} ${response.statusText}`);
    
    if (url.endsWith('.json')) return response.json();
    if (url.endsWith('.csv')) {
        const text = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(text, { 
                header: true, 
                skipEmptyLines: true, 
                dynamicTyping: true, 
                complete: (results) => resolve(results.data), 
                error: (err) => reject(err) 
            });
        });
    }
}
// --- VISTA: LOGIN PAGE ---
function renderLoginPage() {
    const app = document.getElementById('app-container');
    if (!app) return;
    app.innerHTML = `
        <nav class="navbar"><div class="logo"><img src="imagenes/Logogec.png" alt="Grupo Edúcate Colombia"></div><a href="#login-form" class="access-btn">Acceder</a></nav>
        <main class="hero-section">
            <div class="hero-content">
                <h1 class="platform-name">Ruta <span>Saber.</span></h1>
                <p class="subtitle">Accede a tus datos, enfócate en la meta. Identifica fortalezas y diseña planes de mejoramiento accionables para llevar a tu institución al siguiente nivel.</p>
                <form id="login-form" class="login-form"><input type="text" id="user" placeholder="Código DANE o Usuario Admin" required><input type="password" id="pass" placeholder="Clave" required><button type="submit">Ingresar a mi Ruta</button><div id="error-message"></div></form>
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
    }
}

// --- VISTA: DASHBOARD PAGE ---
async function renderDashboardPage() {
    const app = document.getElementById('app-container');
    app.innerHTML = `
        <header class="report-header"><img src="imagenes/Logogec.png" alt="Logo"><h2>Dashboard de Administración</h2></header>
        <main class="dashboard-container">
            <h1 class="section-title">Colegios Registrados</h1>
            <div class="table-container"><table id="colegios-table"><thead><tr><th>Nombre</th><th>DANE</th><th>Acción</th></tr></thead><tbody></tbody></table></div>
        </main>`;
    try {
        const data = await fetchData('colegios.json');
        const tableBody = document.querySelector('#colegios-table tbody');
        data.colegios.sort((a, b) => a.nombre.localeCompare(b.nombre));
        tableBody.innerHTML = data.colegios.map(colegio => `
            <tr>
                <td>${colegio.nombre}</td>
                <td>${colegio.dane}</td>
                <td><a href="reporte.html?dane=${colegio.dane}" class="action-btn" target="_blank">Ver Informe</a></td>
            </tr>`).join('');
    } catch (error) { console.error("Error en dashboard:", error); }
}

// --- VISTA: REPORTE PAGE (MOTOR COMPLETO) ---
async function renderReportPage() {
    const app = document.getElementById('report-content');
    const urlParams = new URLSearchParams(window.location.search);
    const dane = urlParams.get('dane');
    if (!dane) { app.innerHTML = "<h1>Error: DANE no especificado.</h1>"; return; }

    try {
        app.innerHTML = `<div class="loading-screen"><h1>Cargando y procesando datos del informe...</h1></div>`;

        const [colegiosData, nivelesData, nacionalesData, sigmaData, piData] = await Promise.all([
            fetchData('../colegios.json'), fetchData('../data/niveles_icfes.json'), fetchData('../data/promedios_nacionales.json'),
            fetchData(`../data/Sigma_${dane}.csv`), fetchData(`../data/Pi_${dane}.csv`)
        ]);

        const colegioInfo = colegiosData.colegios.find(c => c.dane === dane);
        if (!colegioInfo) throw new Error("Colegio no encontrado");
        
        const areas = ['PUNTAJE_GLOBAL', 'LECTURA_CRITICA', 'MATEMATICAS', 'SOCIALES_CIUDADANAS', 'CIENCIAS_NATURALES', 'INGLES'];
        const promedios = (data, fields) => fields.reduce((acc, field) => ({ ...acc, [field]: data.reduce((sum, row) => sum + (row[field] || 0), 0) / data.length }), {});
        const promediosSigma = promedios(sigmaData, areas);
        const promediosPi = promedios(piData, areas);
        const mergedData = piData.map(studentPi => ({ ...studentPi, EVOLUCION: studentPi.PUNTAJE_GLOBAL - (sigmaData.find(s => s.ID_ESTUDIANTE === studentPi.ID_ESTUDIANTE)?.PUNTAJE_GLOBAL || studentPi.PUNTAJE_GLOBAL) }));
        const top10Destacados = [...mergedData].sort((a, b) => b.PUNTAJE_GLOBAL - a.PUNTAJE_GLOBAL).slice(0, 10);
        const top5Prioritarios = [...mergedData].sort((a, b) => a.PUNTAJE_GLOBAL - b.PUNTAJE_GLOBAL).slice(0, 5);
        const calcularDistribucion = (data, area, niveles) => {
            const counts = [0, 0, 0, 0];
            const rangos = niveles[area.toLowerCase()];
            data.forEach(student => {
                const puntaje = student[area.toUpperCase()];
                if (puntaje <= rangos[0].max) counts[0]++;
                else if (puntaje <= rangos[1].max) counts[1]++;
                else if (puntaje <= rangos[2].max) counts[2]++;
                else counts[3]++;
            });
            return counts.map(count => Math.round((count / data.length) * 100));
        };
        
        const navLinks = areas.slice(1).map(area => `<a href="#desglose-${area.toLowerCase()}">${area.replace(/_/g, ' ')}</a>`).join('');
        app.innerHTML = `
            <header class="report-header"><img src="imagenes/Logogec.png" alt="Logo"><h2>${colegioInfo.nombre.toUpperCase()} | Informe Directivo</h2></header>
            <nav class="report-nav"><a href="#resumen">Resumen</a><a href="#panorama">Panorama</a><a href="#areas">Áreas</a><a href="#estudiantes">Estudiantes</a>${navLinks}</nav>
            <main>
                <section id="portada" class="cover-section">
                     <h1 class="platform-name">Ruta <span>Saber.</span></h1>
                     <h3>${colegioInfo.nombre}</h3>
                     <div class="group-name" style="border-color: var(--accent-color); color: var(--accent-color);">${sigmaData[0]?.GRUPO || 'Grupo 11'}</div>
                </section>
                <section id="resumen"><h2 class="section-title">Resumen Ejecutivo</h2>
                    <div class="grid-layout grid-2-cols">
                        <div class="summary-box"><h3 style="color:var(--accent-color); border-color:var(--accent-color);">Evolución General</h3><p>El grupo muestra una evolución de <strong class="${(promediosPi.PUNTAJE_GLOBAL - promediosSigma.PUNTAJE_GLOBAL) >= 0 ? 'evo-pos' : 'evo-neg'}">${(promediosPi.PUNTAJE_GLOBAL - promediosSigma.PUNTAJE_GLOBAL).toFixed(1)} puntos</strong>.</p></div>
                        <div class="summary-box"><h3 style="color:var(--accent-color); border-color:var(--accent-color);">Puntaje Final</h3><p>El puntaje global final fue de <strong>${promediosPi.PUNTAJE_GLOBAL.toFixed(1)}</strong>, comparado con el promedio nacional (Cal. A) de ${nacionalesData.promedios['2024'].calendario_a.global}.</p></div>
                    </div>
                </section>
                <section id="panorama"><h2 class="section-title">Panorama General</h2><div class="chart-container" id="evolucionChart"></div></section>
                <section id="areas"><h2 class="section-title">Visión General de Evolución por Áreas</h2>
                    <table><thead><tr><th>Área</th><th>Puntaje Inicial</th><th>Puntaje Final</th><th>Evolución</th></tr></thead>
                    <tbody>
                        ${areas.slice(1).map(area => `<tr>
                            <td>${area.replace(/_/g, ' ')}</td>
                            <td>${promediosSigma[area].toFixed(1)}</td>
                            <td>${promediosPi[area].toFixed(1)}</td>
                            <td class="${(promediosPi[area] - promediosSigma[area]) >= 0 ? 'evo-pos' : 'evo-neg'}">${(promediosPi[area] - promediosSigma[area]).toFixed(1)}</td>
                        </tr>`).join('')}
                    </tbody></table>
                </section>
                <section id="estudiantes"><h2 class="section-title">Estudiantes Clave</h2>
                    <div class="grid-layout grid-2-cols">
                        <div class="panel"><h4>Top 10 Destacados</h4><table><thead><tr><th>Nombre</th><th>Puntaje</th><th>Evolución</th></tr></thead><tbody>${top10Destacados.map(e => `<tr><td>${e.NOMBRE_COMPLETO}</td><td>${e.PUNTAJE_GLOBAL.toFixed(1)}</td><td class="${e.EVOLUCION >= 0 ? 'evo-pos' : 'evo-neg'}">${e.EVOLUCION.toFixed(1)}</td></tr>`).join('')}</tbody></table></div>
                        <div class="panel"><h4>Top 5 Atención Prioritaria</h4><table><thead><tr><th>Nombre</th><th>Puntaje</th><th>Evolución</th></tr></thead><tbody>${top5Prioritarios.map(e => `<tr><td>${e.NOMBRE_COMPLETO}</td><td>${e.PUNTAJE_GLOBAL.toFixed(1)}</td><td class="${e.EVOLUCION >= 0 ? 'evo-pos' : 'evo-neg'}">${e.EVOLUCION.toFixed(1)}</td></tr>`).join('')}</tbody></table></div>
                    </div>
                </section>
                ${areas.slice(1).map(area => {
                    const areaKey = area.toLowerCase();
                    const areaTitle = area.replace(/_/g, ' ');
                    return `<section id="desglose-${areaKey}">
                        <h2 class="section-title" style="color:${nivelesData.colores_areas[areaKey]}; border-color:${nivelesData.colores_areas[areaKey]}">Desglose: ${areaTitle}</h2>
                        <div class="desglose-layout">
                            <div class="charts-column">
                                <div class="panel"><h4>Nivel de Desempeño Institucional vs. Nacional 2024</h4><div class="chart-container" id="bullet-${areaKey}"></div></div>
                                <div class="panel"><h4>Distribución de Estudiantes por Nivel (%)</h4><div class="chart-container" id="dist-${areaKey}"></div></div>
                            </div>
                            <div class="analysis-column">
                                <div class="analysis-box"><h4>Análisis y Recomendaciones</h4><p>Análisis detallado para ${areaTitle} irá aquí...</p></div>
                                <a href="../Rutas_areas/Ruta ${areaTitle}.pdf" target="_blank" class="recommendation-btn" style="background-color:${nivelesData.colores_areas[areaKey]}">Consultar Ruta de Mejoramiento</a>
                            </div>
                        </div>
                    </section>`;
                }).join('')}
            </main>
            <footer class="report-footer">Informe generado por: Dirección de Pedagogía - Marlon Galvis V.</footer>`;

        // --- RENDERIZADO DE GRÁFICOS ---
        new ApexCharts(document.querySelector("#evolucionChart"), {
            series: [{ name: 'Puntaje Global', data: [promediosSigma.PUNTAJE_GLOBAL.toFixed(1), promediosPi.PUNTAJE_GLOBAL.toFixed(1)] }],
            chart: { type: 'line', height: 350, fontFamily: 'Barlow Condensed', toolbar: { show: false } },
            stroke: { curve: 'smooth', width: 4 }, markers: { size: 6 }, dataLabels: { enabled: true },
            xaxis: { categories: ['Prueba Inicial (Sigma)', 'Prueba Final (PI)'] }, yaxis: { title: { text: 'Puntaje Global' } },
            annotations: { yaxis: [{ y: nacionalesData.promedios['2024'].calendario_a.global, borderColor: '#fd7e14', label: { text: `Prom. Nal. Cal A 2024: ${nacionalesData.promedios['2024'].calendario_a.global}` } }] },
            colors: [getComputedStyle(document.documentElement).getPropertyValue('--accent-color')]
        }).render();

        areas.slice(1).forEach(area => {
            const areaKey = area.toLowerCase();
            const distColegio = calcularDistribucion(piData, areaKey, nivelesData);
            const distNalA = Object.values(nacionalesData.distribucion_niveles['2024'].calendario_a[areaKey]).slice(0,4);
            const distNalB = Object.values(nacionalesData.distribucion_niveles['2024'].calendario_b[areaKey]).slice(0,4);
            new ApexCharts(document.querySelector(`#dist-${areaKey}`), {
                series: [{ name: 'Institución', data: distColegio }, { name: 'Nacional Cal. A', data: distNalA }, { name: 'Nacional Cal. B', data: distNalB }],
                chart: { type: 'bar', height: 350 }, plotOptions: { bar: { horizontal: false, columnWidth: '80%', } },
                dataLabels: { enabled: true, formatter: (val) => val + '%' },
                xaxis: { categories: ['Nivel 1', 'Nivel 2', 'Nivel 3', 'Nivel 4'] },
                colors: [nivelesData.colores_areas[areaKey], '#A9A9A9', '#424242'], legend: { position: 'top' }
            }).render();
            // ... renderizar el bullet chart para cada área
        });

    } catch (error) {
        console.error("Error fatal al generar el informe:", error);
        app.innerHTML = `<h1>Error al generar el informe</h1><p>${error.message}</p>`;
    }
}
