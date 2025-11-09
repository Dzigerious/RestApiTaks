const express = require('express');
const app = express();
const swagger = ('swagger');

const port = 3000;

app.get('/', (req, res) => {
    res.status(200).send("<h1>This is a main page</h1>")
})

app.listen(port, () => {
    console.log(`Server is working on http://localhost:${port}`)
})