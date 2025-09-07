// --- PROMPT MAESTRO V3.0 - SCRIPT DE DEPURACIÓN V1.0 ---

console.log("--- INICIO DE EJECUCIÓN DE SCRIPT.JS ---");

// --- ROUTER PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("PUNTO DE CONTROL 1: El DOM se ha cargado.");
    const path = window.location.pathname.split("/").pop().split("?")[0];
    console.log(`PUNTO DE CONTROL 2: Detectada la página actual: "${path}"`);

    if (path === 'index.html' || path === '' || path === 'Informe_saber' || path === 'informe_saber') {
        console.log("ACCIÓN: Ejecutando lógica de la página de LOGIN.");
        setupLoginListener();
    } else if (path === 'dashboard.html') {
        console.log("ACCIÓN: Ejecutando lógica del DASHBOARD.");
        // renderDashboardPage(); // Desactivado por ahora
    } else if (path === 'reporte.html') {
        console.log("ACCIÓN: Ejecutando lógica de la página de REPORTE.");
        renderReportPage();
    }
});

// --- LÓGICA DE CARGA DE DATOS (CON DEPURACIÓN) ---
async function fetchData(url) {
    const isRoot = window.location.pathname === '/Informe_saber/' || window.location.pathname === '/Informe_saber/index.html';
    const prefix = isRoot ? '' : '../'; 
    const finalUrl = `${prefix}${url}`;
    
    console.log(`Intentando cargar archivo: ${finalUrl}`);
    
    try {
        const response = await fetch(finalUrl);
        if (!response.ok) {
            console.error(`ERROR al cargar ${finalUrl}: El servidor respondió con estado ${response.status}`);
            throw new Error(`Error de red para ${finalUrl}`);
        }
        console.log(`ÉXITO al cargar ${finalUrl}`);
        
        if (url.endsWith('.json')) return response.json();
        if (url.endsWith('.csv')) {
            const text = await response.text();
            return new Promise(resolve => {
                Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true, complete: (results) => resolve(results.data) });
            });
        }
    } catch (error) {
        console.error(`FALLO CATASTRÓFICO al intentar cargar ${finalUrl}:`, error);
        throw error; // Propagar el error
    }
}

// --- LÓGICA DE LOGIN (CON DEPURACIÓN) ---
function setupLoginListener() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log("PUNTO DE CONTROL 3: Formulario de login encontrado. Añadiendo listener.");
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error("ERROR CRÍTICO: No se encontró el formulario de login en index.html");
    }
}

async function handleLogin(e) {
    e.preventDefault();
    console.log("PUNTO DE CONTROL 4: Se ha hecho clic en el botón de login.");
    // ... (lógica de login sin cambios)
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


// --- LÓGICA DE REPORTE (CON DEPURACIÓN) ---
async function renderReportPage() {
    const reportContainer = document.getElementById('report-content');
    console.log("PUNTO DE CONTROL 5: Iniciando la generación del informe.");
    
    const urlParams = new URLSearchParams(window.location.search);
    const dane = urlParams.get('dane');
    console.log(`PUNTO DE CONTROL 6: DANE extraído de la URL: ${dane}`);

    if (!dane) {
        reportContainer.innerHTML = "<h1>Error: DANE no especificado en la URL.</h1>";
        console.error("Fallo en el Punto de Control 6: No se encontró el DANE.");
        return;
    }

    try {
        reportContainer.innerHTML = "<h1>Cargando datos... Verifique la consola para ver el progreso.</h1>";
        
        console.log("PUNTO DE CONTROL 7: Iniciando carga de todos los archivos de datos en paralelo.");
        const [colegiosData, nivelesData, nacionalesData, sigmaData, piData] = await Promise.all([
            fetchData('colegios.json'),
            fetchData('data/niveles_icfes.json'),
            fetchData('data/promedios_nacionales.json'),
            fetchData(`data/Sigma_${dane}.csv`),
            fetchData(`data/Pi_${dane}.csv`)
        ]);
        console.log("PUNTO DE CONTROL 8: ¡Todos los archivos de datos se han cargado exitosamente!");
        
        reportContainer.innerHTML = `
            <h1>¡Éxito!</h1>
            <p>Todos los datos para el DANE ${dane} se han cargado correctamente.</p>
            <p>Ahora podemos proceder a construir el informe completo.</p>
        `;

    } catch (error) {
        console.error("ERROR FATAL durante la generación del informe:", error);
        reportContainer.innerHTML = `<h1>Error al Cargar los Datos</h1><p>No se pudo generar el informe. Revise la consola para ver qué archivo falló.</p><p>Error: ${error.message}</p>`;
    }
}
