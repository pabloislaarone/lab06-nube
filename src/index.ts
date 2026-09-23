import express from 'express';
import path from 'path';
import { initDB } from './database';
import db from './database';
import authRoutes from './routes/auth';
import documentoRoutes from './routes/documentos';
import usuarioRoutes from './routes/usuarios';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

initDB();

app.use('/auth', authRoutes);
app.use('/documentos', documentoRoutes);
app.use('/usuarios', usuarioRoutes);

app.get('/auditoria', (req, res) => {
  db.all(`SELECT * FROM Auditoria ORDER BY fecha DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error consultando auditoría.' });
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});