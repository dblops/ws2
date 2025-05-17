const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());  // Mejor usar express.json() que bodyParser.json()

let client;
let clientReady = false;
let latestQR = '';

async function startClient() {
  try {
    client = await wppconnect.create({
      session: 'session-boda',
      catchQR: (qrCode, asciiQR, attempts, urlCode) => {
        latestQR = qrCode;
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
  if (!latestQR) {
    return res.status(404).send(`
      <html>
        <head><title>QR No disponible</title></head>
        <body style="text-align:center; font-family:sans-serif;">
          <h1>QR aún no generado</h1>
          <p>Por favor espera unos segundos y recarga esta página.</p>
        </body>
      </html>
    `);
  }

  const qrBase64 = latestQR.startsWith('data:image')
    ? latestQR.split(',')[1]
    : latestQR;

  res.send(`
    <html>
      <head><title>Escanea el QR</title></head>
      <body style="text-align:center; font-family:sans-serif;">
        <h1>Escanea este código QR con tu WhatsApp</h1>
        <img src="data:image/png;base64,${qrBase64}" style="width:300px;height:300px;" />
        <p>Una vez escaneado, esta pantalla se actualizará.</p>
        <script>
          setTimeout(() => window.location.reload(), 10000);
        </script>
      </body>
    </html>
  `);
});

app.get('/status', (req, res) => {
  res.json({ clientReady });
});

app.post('/send', async (req, res) => {
  console.log('Body recibido:', req.body);  // DEBUG para ver qué llega

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
