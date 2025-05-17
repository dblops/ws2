const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

let client;
let clientReady = false;

async function startClient() {
  try {
    client = await wppconnect.create({
      session: 'session-boda',
      catchQR: (qr, asciiQR) => {
        console.log('Escanea este código QR con tu WhatsApp:\n', asciiQR);
      },
      statusFind: (statusSession) => {
        console.log('Estado de la sesión:', statusSession);
        if (statusSession === 'isLogged' || statusSession === 'qrReadSuccess') {
          clientReady = true;
        }
      },
      headless: true,
      devtools: false,
      useChrome: false, // 🚫 Desactivar Chrome para Railway
      browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'], // ✅ Requerido para entorno cloud
      debug: false,
    });

    console.log('Cliente WPPConnect listo');
  } catch (error) {
    console.error('Error creando cliente:', error);
  }
}

startClient();

app.get('/status', (req, res) => {
  res.json({ clientReady });
});

app.post('/send', async (req, res) => {
  if (!clientReady) {
    return res.status(500).json({ error: 'Cliente no inicializado aún' });
  }

  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).json({ error: 'Falta número o mensaje' });
  }

  try {
    const chatId = `${number}@c.us`;
    const result = await client.sendText(chatId, message);
    res.json({ status: 'ok', result });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: error.toString() });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
