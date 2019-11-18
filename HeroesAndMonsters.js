const Express = require('express');
const HTTP = require('http');
const IO = require('socket.io');

const app = Express();//Create Express Server
const server = HTTP.Server(app);//Link Express to HTTP Server to allow use of Socket.io

app.use(Express.static('public'));//Allow public folder to be accessed from front-end

const io = IO(server);//Create socket.io server

const port = 4000;

app.get('/', (req, res) =>
{
    res.sendFile('views/home.html', { root: __dirname });
});//On get request, render home.ejs

const clients = {};
io.on('connection', (socket) =>
{
    clients[socket.id] = {};
    console.log(`${socket.id} Connected`);

    socket.on('setName', (name) =>
    {
        clients[socket.id].name = name;
        clients[socket.id].ready = false;//All users not ready by default
        console.log(`${socket.id} set name to ${name}`);
        io.sockets.emit('lobbyUpdate', clients);//Update all clients that new user joined
    });//On player set name

    socket.on('disconnect', () =>
    {
        delete clients[socket.id];
        console.log(`${socket.id} Disconnected`);
        io.sockets.emit('lobbyUpdate', clients);//Update all clients that user left
    });//On socket disconnect

    socket.on('lobbyReady', () =>
    {
        if (true === clients[socket.id].ready)
        {
            clients[socket.id].ready = false;
            console.log(`${socket.id} isn't Ready`);
        }
        else
        {
            clients[socket.id].ready = true;
            console.log(`${socket.id} is Ready`);
        }//Toggles ready status for user
        io.sockets.emit('lobbyUpdate', clients);//Update lobby status to all clients
    });//On user toggling ready

    socket.on('chatMessage', (messageText) =>
    {
        const message = `${null != clients[socket.id].name ? clients[socket.id].name : socket.id}: ${messageText}`;//Message is combination of name and message text
        console.log(message);
        io.sockets.emit('chatMessage', message);
    });//When client sents chat, forward to other clients
});//On socket connection

server.listen(port, () => console.log(`Listening on Port: ${port}`));//Run http server
