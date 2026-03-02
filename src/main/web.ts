import { startServer } from './server';

const SERVER_PORT = Number(process.env.PORT) || 19321;

startServer(SERVER_PORT).then(() => {
  console.log(`Clankadex web app running at http://localhost:${SERVER_PORT}`);
});
