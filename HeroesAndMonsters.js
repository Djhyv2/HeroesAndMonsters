const Express = require('express');
const HTTP = require('http');
const IO = require('socket.io');

const app = Express();//Create Express Server
app.use(Express.static('public'));//Allow public folder to be accessed from front-end
const server = HTTP.Server(app);//Link Express to HTTP Server to allow use of Socket.io
const io = IO(server);//Create socket.io server
const port = 4000;

const minimumPlayers = 5;
const maximumPlayers = 9;
const clients = {};

app.get('/', (req, res) =>
{
    res.sendFile('views/home.html', { root: __dirname });
});//On get request, render home.ejs

function AssignRoles()
{
    const clientKeys = Object.keys(clients);
    for (let count = clientKeys.length - 1; 0 < count; count -= 1)
    {
        const index = Math.floor(Math.random() * count);
        const temp = clientKeys[count];
        clientKeys[count] = clientKeys[index];
        clientKeys[index] = temp;
    }//Fisher-Yates Shuffling Algorithm
    if (0 < clientKeys.length)
    {
        clients[clientKeys[0]].role = 'Odysseus';
        clients[clientKeys[0]].team = 'Hero';
    }
    if (1 < clientKeys.length)
    {
        clients[clientKeys[1]].role = 'Minotaur';
        clients[clientKeys[1]].team = 'Monster';
    }
    if (2 < clientKeys.length)
    {
        clients[clientKeys[2]].role = 'Tiresias';
        clients[clientKeys[2]].team = 'Citizen';
    }
    if (3 < clientKeys.length)
    {
        clients[clientKeys[3]].role = 'Achilles';
        clients[clientKeys[3]].team = 'Hero';
    }
    if (4 < clientKeys.length)
    {
        clients[clientKeys[4]].role = 'Polyphemus';
        clients[clientKeys[4]].team = 'Monster';
    }
    if (5 < clientKeys.length)
    {
        clients[clientKeys[5]].role = 'Helen';
        clients[clientKeys[5]].team = 'Citizen';
    }
    if (6 < clientKeys.length)
    {
        clients[clientKeys[6]].role = 'Theseus';
        clients[clientKeys[6]].team = 'Hero';
    }
    if (7 < clientKeys.length)
    {
        clients[clientKeys[7]].role = 'Medusa';
        clients[clientKeys[7]].team = 'Monster';
    }
    if (8 < clientKeys.length)
    {
        clients[clientKeys[8]].role = 'Deadalus';
        clients[clientKeys[8]].team = 'Citizen';
    }
    //Assign roles, only 5 are required
}


io.on('connection', (socket) =>
{
    socket.on('setName', (name) =>
    {
        clients[socket.id] = { name, ready: false };//Sets name and default of not ready
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
        const clientKeys = Object.keys(clients);
        if (clientKeys.length === clientKeys.filter((client) => true === clients[client].ready).length && minimumPlayers <= clientKeys.length && maximumPlayers >= clientKeys.length)
        {
            AssignRoles();
            io.sockets.emit('gameStart', clients);
        }//If all players ready and between 5-9 players, start the game
        else
        {
            io.sockets.emit('lobbyUpdate', clients);//Update lobby status to all clients
        }
    });//On user toggling ready

    socket.on('chatMessage', (messageText) =>
    {
        const message = `${clients[socket.id].name}: ${messageText}`;//Message is combination of name and message text
        console.log(message);
        io.sockets.emit('chatMessage', message);
    });//When client sents chat, forward to other clients
});//On socket connection

server.listen(port, () => console.log(`Listening on Port: ${port}`));//Run http server