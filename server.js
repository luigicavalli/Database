import express from 'express';
import morgan from 'morgan';
import 'express-async-errors';

const app = express();
const port = 3000;

app.use(morgan('dev'));

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
