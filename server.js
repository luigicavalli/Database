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
  const jwtToken = jwt.sign({ userID: 10 }, secretKey, { expiresIn: '1h' });

  const { email, password } = req.body;

  res.status(200).json({
    message: 'Success!',
    apiToken: jwtToken,
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
      apiToken: jwtToken,
      name: name,
      surname: surname,
      email: email,
      password: cryptedPassword ?? `not found`,
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
