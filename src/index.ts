import express from 'express';
import { initDB } from './database';

const app = express();
const port = 3000;

app.use(express.json());

// Inicializar la base de datos
initDB();

app.get('/', (req, res) => {
  res.send('SecureDocs API - Inicializada');
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});