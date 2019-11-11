const Express = require('express');
const HTTP = require('http');
const IO = require('socket.io');

const app = Express();//Create Express Server
const server = HTTP.Server(app);//Link Express to HTTP Server to allow use of Socket.io

app.set('view engine', 'ejs');//Import EJS to Express

app.use(Express.static('public'));//Allow public folder to be accessed from front-end

const io = IO(server);//Create socket.io server

const port = 4000;

app.get('/', (req, res) =>
{
    res.render('home');
});//On get request, render home.ejs

const clients = {};
io.on('connection', (socket) =>
{
    clients[socket.id] = {};
    console.log(`${socket.id} Connected`);

    socket.on('disconnect', () =>
    {
        delete clients[socket.id];
        console.log(`${socket.id} Disconnected`);
    });//On socket disconnect

    socket.on('chatMessage', (message) =>
    {
        console.log(message);
        io.sockets.emit('chatMessage', message);
    });//When client sents chat, forward to other clients
});//On socket connection

server.listen(port, () => console.log(`Listening on Port: ${port}`));//Run http server
