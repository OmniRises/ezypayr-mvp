import express from 'express';
import fs from 'fs';

const app = express();
const jwks = JSON.parse(fs.readFileSync('./jwks.json', 'utf-8'));

app.get('/jwks.json', (req, res) => res.json(jwks));

app.listen(8089, () => console.log('JWKS endpoint at http://localhost:8089/jwks.json'));


