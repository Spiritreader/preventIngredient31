const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const backend = require("./backend.js")
const httpServer = http.createServer(app);

app.get("/api", cors(), backend.parseQuery, backend.handleApiGet);
app.get("/api/v2", cors(), backend.parseQuery, backend.convertQueryToXmlFormat, backend.handleApiV2Get);

app.use(express.static('/app/frontend'));
app.use(helmet());

httpServer.listen(8080, () => {
	console.log("We need less 31! Listening on port 8080!");
});