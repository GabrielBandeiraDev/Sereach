const WebSocket = require('ws');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;
const wss = new WebSocket.Server({ noServer: true });

let points = 0;

// Carregar pontos do arquivo
const pointsFilePath = path.join(__dirname, 'points.json');
if (fs.existsSync(pointsFilePath)) {
  try {
    const fileContent = fs.readFileSync(pointsFilePath, 'utf8');
    if (fileContent) {
      const parsedContent = JSON.parse(fileContent);
      if (parsedContent && typeof parsedContent.points === 'number') {
        points = parsedContent.points;
      }
    }
  } catch (err) {
    console.error('Erro ao carregar o arquivo points.json:', err);
  }
}

// Manipular conexões WebSocket
wss.on('connection', (ws) => {
  // Enviar pontos atuais para a nova conexão
  ws.send(JSON.stringify({ points }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.points !== undefined) {
        points = data.points;
        fs.writeFileSync(pointsFilePath, JSON.stringify({ points }));

        // Enviar os novos pontos para todos os clientes
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ points }));
          }
        });
      }
    } catch (err) {
      console.error('Erro ao processar a mensagem:', err);
    }
  });
});

// Configurar o servidor Express para suportar WebSocket
const server = app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
