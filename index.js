const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const QRCode = require('qrcode');

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
      catchQR: (qr, asciiQR) => {
        latestQR = qr; // guardar para mostrar en /qr
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

app.get('/qr', async (req, res) => {
  if (!latestQR) return res.status(404).send('QR aún no generado.');
  try {
    const qrDataUrl = await QRCode.toDataURL(latestQR);
    res.send(`
      <html>
        <body style="text-align:center; font-family:sans-serif;">
          <h1>Escanea este código QR</h1>
          <img src="${qrDataUrl}" style="width:300px;height:300px;" />
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Error generando el QR.');
  }
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
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
