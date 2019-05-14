const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const app = express();
const PORT = 1337;
const backend = require('./backend.js')

app.get("/api", cors(), backend.parseQuery, backend.handleApiGet);
app.get("/api/v2", cors(), backend.parseQuery, backend.convertQueryToXmlFormat, backend.handleApiV2Get);
app.use(express.static('frontend'));
app.use(helmet());
app.listen(PORT, () => {
    console.log('We need less 31! Listening on port: ' + PORT);
});