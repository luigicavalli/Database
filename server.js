import express from 'express';
import morgan from 'morgan';
import 'express-async-errors';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mysql from 'mysql';

const app = express();
const port = 3000;

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

app.get('/info', (req, res) => {
  res.status(200).json({ message: 'Success!' });
});

app.post('/login', (req, res) => {
  const token = 'hdjdjbdkdw';

  const { email, password } = req.body;

  res.status(200).json({
    message: 'Success!',
    apiToken: token,
    email: email,
    password: password,
  });
});

app.post('/sign-up', async (req, res) => {
  const { name, surname, email, password } = req.body;

  // Cripto la password per poi salvarla nel database;

  const cryptedPassword = await bcrypt.hash(password, 10);

  if (cryptedPassword !== null) {
    res.status(200).json({
      message: 'success',
      name: name,
      surname: surname,
      email: email,
      password: cryptedPassword??`not found`,
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
