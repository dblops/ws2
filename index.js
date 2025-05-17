const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// Ya no necesitas el paquete QRCode porque usaremos el QR base64 directo

const app = express();

app.use(cors());
app.use(bodyParser.json());

let client;
let clientReady = false;
let latestQR = '';

async function startClient() {
  try {
    client = await wppconnect.create({
      session: 'session-boda',
      catchQR: (qrCode, asciiQR, attempts, urlCode) => {
        latestQR = qrCode; // Guarda el QR base64 recibido
        console.log('QR capturado (base64):', qrCode ? qrCode.substring(0, 30) + '...' : 'Vacío');
        console.log('Accede a /qr en tu navegador para escanearlo.');
      },
      statusFind: (statusSession) => {
        console.log('Estado de la sesión:', statusSession);
        if (statusSession === 'isLogged' || statusSession === 'qrReadSuccess') {
          clientReady = true;
        }
      },
      headless: true,
      devtools: false,
      useChrome: true,
      executablePath: '/usr/bin/chromium',
      browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
      debug: false,
    });

    console.log('Cliente WPPConnect listo');
  } catch (error) {
    console.error('Error creando cliente:', error);
  }
}

startClient();

app.get('/qr', (req, res) => {
  if (!latestQR) return res.status(404).send('QR aún no generado.');

  // Asumimos que latestQR es base64 (sin data:image/png;base64,)
  res.send(`
    <html>
      <head><title>Escanea el QR</title></head>
      <body style="text-align:center; font-family:sans-serif;">
        <h1>Escanea este código QR con tu WhatsApp</h1>
        <img src="data:image/png;base64,${latestQR}" style="width:300px;height:300px;" />
        <p>Una vez escaneado, esta pantalla se actualizará.</p>
      </body>
    </html>
  `);
});

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
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
