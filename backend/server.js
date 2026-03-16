const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

const assetsRouter = require('./routes/assets');
const predictionsRouter = require('./routes/predictions');
const copilotRouter = require('./routes/copilot');
const telemetryRouter = require('./routes/telemetry');
const historyRouter = require('./routes/history');
const actionsRouter = require('./routes/actions');
const pdfExportRouter = require('./routes/pdf-export');

app.use('/api/assets', assetsRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/copilot', copilotRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/history', historyRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/export', pdfExportRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
