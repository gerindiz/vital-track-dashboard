import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);

// Configuramos Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

console.log("🚀 Servidor de telemetría médica iniciado (ES Module)...");

let datosGrafica = [
    { name: 'Vacunas', temp: 4.0 },
    { name: 'Insulina', temp: 5.0 },
    { name: 'Suero', temp: 15.0 }
];

// Simulador de temperatura
setInterval(() => {
    datosGrafica = datosGrafica.map(item => ({
        ...item,
        temp: parseFloat((item.temp + (Math.random() - 0.6)).toFixed(2))
    }));

    io.emit('telemetria_update', datosGrafica);
    console.log("📡 Enviando actualización:", datosGrafica);
}, 3000);

server.listen(3001, () => {
    console.log("✅ Backend corriendo en http://localhost:3001");
});