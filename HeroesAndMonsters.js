const Express = require('express');
const HTTP = require('http');
const IO = require('socket.io');

const app = Express();//Create Express Server
app.use(Express.static('public'));//Allow public folder to be accessed from front-end
const server = HTTP.Server(app);//Link Express to HTTP Server to allow use of Socket.io
const io = IO(server);//Create socket.io server
const port = 4000;

const minimumPlayers = 3;
const maximumPlayers = 9;
let clients = {};
let gameStarted = false;
let activePlayer = 0;
let voteTarget;

app.get('/', (req, res) =>
{
    res.sendFile('views/home.html', { root: __dirname });
});//On get request, render home.ejs

function AssignRoles()
{
    const clientKeys = Object.keys(clients).sort();
    for (let index = 0; clientKeys.length > index; index += 1)
    {
        clients[clientKeys[index]].order = index;
    }//Set player order based on socket id
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

function sendGameMessage(message)
{
    console.log(message);
    io.sockets.emit('gameMessage', message);
}

function startQuest()
{
    const activeSocketID = Object.keys(clients).filter((client) => clients[client].order === activePlayer)[0];
    sendGameMessage(`${clients[activeSocketID].name} is choosing the next target for a quest`);
    io.to(activeSocketID).emit('promptQuest', clients);
}

function resetVotes()
{
    Object.keys(clients).forEach((client) =>
    {
        delete clients[client].vote;
    });//Clears vote from each player
    voteTarget = null;
}

function nextPlayer()
{
    while (-1 !== activePlayer)
    {
        activePlayer += 1;
        const clientKeys = Object.keys(clients);
        activePlayer %= clientKeys.length;
        for (let i = 0; clientKeys.length > i; i += 1)
        {
            if (activePlayer === clients[clientKeys[i]].order && false === clients[clientKeys[i]].dead)
            {
                return;
            }
        }
    }
}

function startOdysseus()
{
    const odysseus = Object.keys(clients).filter((client) => false === clients[client].dead && 'Odysseus' === clients[client].role);
    if (1 === odysseus.length)
    {
        io.to(odysseus[0]).emit('promptOdysseus', clients);
    }
    else
    {
        startHelen();
    }
}

function tallyVotes()
{
    const clientKeys = Object.keys(clients);
    const votesCast = clientKeys.filter((client) => null != clients[client].vote).length;
    const playersAlive = clientKeys.filter((client) => false === clients[client].dead).length;
    if (playersAlive !== votesCast)
    {
        return;
    }//Only proceed if all votes cast
    const yayVotes = clientKeys.filter((client) => true === clients[client].vote).length;
    const nayVotes = playersAlive - yayVotes;
    if (yayVotes >= nayVotes)
    {
        sendGameMessage(`Quest to slay ${clients[voteTarget].name} passes on a vote of ${yayVotes} to ${nayVotes}`);
        const possibleHeroes = clientKeys.filter((client) => 'Hero' === clients[client].team && false === clients[client].dead && true === clients[client].vote);
        if (0 !== possibleHeroes.length)
        {
            possibleHeroes.forEach((client) =>
            {
                io.to(client).emit('askReveal', clients[voteTarget].name);
            });//Asks living heroes who voted for quest to reveal themselves
        }
        else
        {
            startOdysseus();
        }//If no potential heroes move on
    }
    else
    {
        sendGameMessage(`Quest to slay ${clients[voteTarget].name} fails on a vote of ${yayVotes} to ${nayVotes}`);
        resetVotes();
        nextPlayer();
        startQuest();//Will clear current vote, move to next player, and repeat
    }
}

function clearRevealVotes()
{
    resetVotes();
    Object.keys(clients).forEach((client) =>
    {
        delete clients[client].revealVote;
    });//Clears vote from each player
}

function tallyReveal()
{
    const clientKeys = Object.keys(clients);
    const votesCast = clientKeys.filter((client) => null != clients[client].revealVote).length;
    const heroesOnQuest = clientKeys.filter((client) => 'Hero' === clients[client].team && false === clients[client].dead && true === clients[client].vote).length;
    if (votesCast === heroesOnQuest)
    {
        clearRevealVotes();
        sendGameMessage('No hero volunteered to go on quest');
        startOdysseus();//Odysseus is next character to act
    }//If all heroes declined
}


function restartGame(message)
{
    io.sockets.emit('gameEnding', message);
    gameStarted = false;
    clients = {};
    activePlayer = 0;
    voteTarget = null;
}

function checkVictory()
{
    const clientKeys = Object.keys(clients);
    if (0 === clientKeys.filter((client) => false === clients[client].dead && 'Hero' === clients[client].team).length)
    {
        restartGame('Monsters Win! Please Refresh.');
        return;
    }//If no heroes alive, monsters win
    if (0 === clientKeys.filter((client) => false === clients[client].dead && 'Monster' === clients[client].team).length)
    {
        restartGame('Heroes Win! Please Refresh.');
    }//If no monsters alive, heroes win
}

function executeQuest(hero)
{
    io.sockets.emit('clearAskReveal', null);
    clients[hero].isRevealedTeam = true;
    clients[voteTarget].dead = true;
    clients[voteTarget].isRevealedTeam = true;
    //Reveal hero and kill target
    sendGameMessage(`${clients[hero].name} slays the ${clients[voteTarget].team}, ${clients[voteTarget].name}`);
    io.sockets.emit('updatePlayerList', clients);
    clearRevealVotes();
    checkVictory();
    startOdysseus();
}

io.on('connection', (socket) =>
{
    socket.on('setName', (name) =>
    {
        if (false === gameStarted)
        {
            clients[socket.id] = { name, ready: false, dead: false };//Sets name and default of not ready and not dead
            console.log(`${socket.id} set name to ${name}`);
            io.sockets.emit('lobbyUpdate', clients);//Update all clients that new user joined
        }//Players can only join if game not in progress
        else
        {
            io.to(socket.id).emit('gameInProgress', null);
        }
    });//On player set name

    socket.on('disconnect', () =>
    {
        console.log(`${socket.id} Disconnected`);
        sendGameMessage(`${null != clients[socket.id] ? clients[socket.id].name : 'Player'} Disconnected`);
        if (true === gameStarted && false === clients[socket.id].dead)
        {
            restartGame('Game Ending, Please Refresh');
            return;
        }//Restart game if living player leaves
        delete clients[socket.id];
        if (true === gameStarted && 0 === Object.keys(clients).length)
        {
            restartGame('Game Ending, Please Refresh');
            return;
        }//Restart game if last player leaves
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
            gameStarted = true;
            startQuest();
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

    socket.on('gameMessage', (message) =>
    {
        sendGameMessage(message);
    });//When client sents message, forward to other clients

    socket.on('questTarget', (target) =>
    {
        sendGameMessage(`${clients[socket.id].name} proposes a quest to slay ${clients[target].name}`);
        voteTarget = target;
        Object.keys(clients).filter((client) => false === clients[client].dead).forEach((client) =>
        {
            io.to(client).emit('startVote', clients[target].name);
        });//Only living players may vote
    });//When active player selects target for quest

    socket.on('voteResult', (result) =>
    {
        sendGameMessage(`${clients[socket.id].name} votes to ${false === result ? 'not ' : ''} slay ${clients[voteTarget].name}`);
        clients[socket.id].vote = result;
        tallyVotes();
    });//When a player votes for a quest

    socket.on('revealResult', (result) =>
    {
        clients[socket.id].revealVote = result;
        if (true === result)
        {
            executeQuest(socket.id);
        }//If hero agreed, reveal and kill target
        else
        {
            tallyReveal();
        }//Else check if all heroes declined
    });

    socket.on('drunkTarget', (target) =>
    {
        if ('None' !== target)
        {
            console.log(`${clients[socket.id].name} got ${clients[target].name} drunk`);
            clients[target].drunk = true;
        }//Gets target drunk
        else
        {
            console.log(`${clients[socket.id].name} got nobody drunk`);
        }
        startHelen();
    });
});//On socket connection

server.listen(port, () => console.log(`Listening on Port: ${port}`));//Run http server
