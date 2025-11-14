const express = require('express');
const path = require('path');
const http = require('http');
const os = require('os');
const { exec } = require('child_process');

const app = express();
const PORT = 7500;

// Configuración de repositorios
const REPOS = [
    {
        name: 'SanjuanFuturo',
        port: 6250,
        path: path.join(__dirname, '..', 'repos', 'SanjuanFuturo'),
        batFile: 'run.bat'
    },
    {
        name: 'construituciudad_sanjuan',
        port: 3344,
        path: path.join(__dirname, '..', 'repos', 'construituciudad_sanjuan'),
        batFile: 'run.bat'
    },
    {
        name: 'juegoconfotosturisticas',
        port: 1820,
        path: path.join(__dirname, '..', 'repos', 'juegoconfotosturisticas'),
        batFile: 'run.bat'
    },
    {
        name: 'solyestrellas',
        port: 7400,
        path: path.join(__dirname, '..', 'repos', 'solyestrellas'),
        batFile: 'run.bat'
    },
    {
        name: 'tragamonedas',
        port: 9722,
        path: path.join(__dirname, '..', 'repos', 'tragamonedas'),
        batFile: 'run.bat'
    },
    {
        name: 'vicuniacobre',
        port: 9999,
        path: path.join(__dirname, '..', 'repos', 'vicuniacobre'),
        batFile: 'run.bat'
    }
];

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Función para obtener la IP local
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Función para verificar si un puerto está activo
function checkPort(port) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/',
            method: 'GET',
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            resolve(true);
        });

        req.on('error', () => {
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

// API: Obtener información del sistema
app.get('/api/system-info', (req, res) => {
    const localIP = getLocalIP();
    res.json({
        ip: localIP,
        port: PORT,
        fullUrl: `http://${localIP}:${PORT}`
    });
});

// API: Obtener estado de todos los repositorios
app.get('/api/repos/status', async (req, res) => {
    const results = [];
    
    for (const repo of REPOS) {
        const isRunning = await checkPort(repo.port);
        results.push({
            name: repo.name,
            port: repo.port,
            isRunning: isRunning,
            url: `http://localhost:${repo.port}`,
            path: repo.path
        });
    }
    
    res.json(results);
});

// API: Ejecutar un repositorio
app.post('/api/repos/start', (req, res) => {
    const { repoName } = req.body;
    
    const repo = REPOS.find(r => r.name === repoName);
    if (!repo) {
        return res.status(404).json({ error: 'Repositorio no encontrado' });
    }

    const batPath = path.join(repo.path, repo.batFile);
    
    // Ejecutar el .bat en una nueva ventana de cmd
    exec(`start cmd /k "cd /d "${repo.path}" && ${repo.batFile}"`, (error) => {
        if (error) {
            console.error(`Error ejecutando ${repoName}:`, error);
            return res.status(500).json({ 
                error: 'Error al ejecutar el repositorio',
                details: error.message 
            });
        }
        
        res.json({ 
            success: true, 
            message: `${repoName} iniciado correctamente`,
            port: repo.port
        });
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    const localIP = getLocalIP();
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 REPOMASTER - Gestor de Repositorios');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📡 Servidor corriendo en:`);
    console.log(`   - Local:   http://localhost:${PORT}`);
    console.log(`   - Network: http://${localIP}:${PORT}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📊 Monitoreando ${REPOS.length} repositorios`);
    console.log('═══════════════════════════════════════════════════════');
});
