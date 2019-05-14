const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const backend = require("./backend.js")

const privateKey = fs.readFileSync('/etc/letsencrypt/live/mensauni.de/privkey.pem', 'utf8');
const cert = fs.readFileSync('/etc/letsencrypt/live/mensauni.de/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/mensauni.de/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: cert,
	ca: ca
}
const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app);

app.get("/api", cors(), backend.parseQuery, backend.handleApiGet);
app.get("/api/v2", cors(), backend.parseQuery, backend.convertQueryToXmlFormat, backend.handleApiV2Get);

/* Set up server */
app.all('*', ensureSecure);
app.use(express.static('/var/opt/preventIngredient31/frontend'));
app.use(helmet());
function ensureSecure (req, res, next) {
	        if (req.secure) {
			next();
		} else {
			res.redirect('https://' + req.headers.host + req.url);
		}
}

httpServer.listen(80, () => {
	console.log('We need less 31! Listening on port 80');
	httpsServer.listen(443, () => {
		console.log("We need less 31! HTTPS Server listening on port 443");
		process.setgid('node_server');
		process.setuid('node_server');
		console.log("Setup complete, dropped root, switched to user node_server");
	});
});