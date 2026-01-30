const express = require('express');
const cors = require('cors');

const app = express();

require('./startup/db')();

app.use(express.json());

app.use(cors({
    origin: '*'
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

require('./startup/routes')(app);

const port = 8080;

app.listen(port, () => console.log(`Acesse: http://localhost:${port}/`));