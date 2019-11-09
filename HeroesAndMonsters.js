const Express = require('express');
const HTTP = require('http');
const IO = require('socket.io');

const app = Express();
const server = HTTP.Server(app);

app.set('view engine', 'ejs');

app.use(Express.static('scripts'));

const io = IO(server);

const port = 4000;

app.get('/', (req, res) =>
{
    res.render('home');
});

io.on('connection', (socket) =>
{
    console.log('Client Connected');
});

server.listen(port, () => console.log(`Listening on Port: ${port}`));
