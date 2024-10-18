import express from 'express';
import morgan from 'morgan';
import 'express-async-errors';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mysql from 'mysql';
import 'dotenv/config';

const app = express();
const port = 3000;

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

let connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

connection.connect((error) => {
  if (error) {
    console.error(error.message);
    return;
  }
  console.log('Database connected');
});

app.get('/info', (req, res) => {
  res.status(200).json({ message: 'Success!' });
});

const secretKey = process.env.SECRET_KEY;

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users INNER JOIN roles ON users.role_id = roles.role_id WHERE email = ?';

  connection.query(query, [email], async (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Errore nel server', error });
    }

    if (results.length === 0) {
      return res
        .status(401)
        .json({ message: 'Credenziali errate: utente non trovato' });
    }

    const user = results[0];

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res
        .status(401)
        .json({ message: 'Credenziali errate: password sbagliata' });
    }

    const jwtToken = jwt.sign({ userID: user.id }, secretKey, {
      expiresIn: '1h',
    });

    res.status(200).json({
      message: 'Login effettuato con successo!',
      apiToken: jwtToken,
      user: user,
    });
  });
});

app.post('/sign-up', async (req, res) => {
  const { name, surname, email, password } = req.body;

  try {
    const cryptedPassword = await bcrypt.hash(password, 10);

    const insertQuery = 'INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)';

    connection.query(insertQuery, [name, surname, email, cryptedPassword], (error, results) => {
      if (error) {
        console.error('Errore durante l\'inserimento:', error);
        return res.status(500).json({ message: 'Errore durante l\'inserimento', error });
      }

      const userId = results.insertId;

      const selectQuery = 'SELECT * FROM users WHERE id = ?';

      connection.query(selectQuery, [userId], (error, results) => {
        if (error) {
          console.error('Errore durante la selezione:', error);
          return res.status(500).json({ message: 'Errore durante la selezione', error });
        }

        if (results.length === 0) {
          return res.status(404).json({ message: 'Utente non trovato' });
        }

        const user = results[0];

        const jwtToken = jwt.sign({ userID: user.id }, secretKey, {
          expiresIn: '1h',
        });

        res.status(201).json({
          message: 'Utente aggiunto con successo',
          apiToken: jwtToken,
          user,
        });
      });
    });
  } catch (error) {
    console.error('Errore durante la criptazione della password:', error);
    res.status(500).json({ message: 'Errore durante la criptazione della password', error });
  }
});


app.put('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { name, surname, email, password } = req.body;

  let updateFields = [];
  let updateValues = [];

  if (name) {
    updateFields.push('name = ?');
    updateValues.push(name);
  }

  if (surname) {
    updateFields.push('surname = ?');
    updateValues.push(surname);
  }

  if (email) {
    updateFields.push('email = ?');
    updateValues.push(email);
  }

  if (password) {
    const cryptedPassword = await bcrypt.hash(password, 10);
    updateFields.push('password = ?');
    updateValues.push(cryptedPassword);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'Nessun campo da aggiornare fornito' });
  }

  const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
  updateValues.push(id);

  connection.query(updateQuery, updateValues, (error, results) => {
    if (error) {
      console.error('Errore durante l\'aggiornamento:', error);
      return res.status(500).json({ message: 'Errore del server', error });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    const selectQuery = 'SELECT * FROM users WHERE id = ?';
    connection.query(selectQuery, [id], (error, results) => {
      if (error) {
        console.error('Errore durante la selezione:', error);
        return res.status(500).json({ message: 'Errore durante la selezione', error });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      const user = results[0];

      const jwtToken = jwt.sign({ userID: user.id }, secretKey, {
        expiresIn: '1h',
      });

      res.status(200).json({
        message: 'Utente aggiornato con successo',
        apiToken: jwtToken,
        user,
      });
    });
  });
});

app.delete('/delete/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM users WHERE id = ?';

  connection.query(query, [id], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Errore del server', error });
    }
    res.status(200).json({message: 'Utente eliminato con successo', results});
  })
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
