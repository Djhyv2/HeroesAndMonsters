//eslint-disable-next-line no-undef
const socket = io();//Connect to serverside socket

function submitName(e)
{
    e.preventDefault();//Prevent postback
    socket.emit('setName', $('#txtName').val());//Submit name to server
    $('#modalName').modal('hide');//Hide modal after submission

    $('#modalLobby').modal('show');//Show lobby after joining
}

function sendMessage(e)
{
    e.preventDefault();//Prevent postback
    const txtChat = $('#txtChat');
    if ('' !== txtChat.val())
    {
        socket.emit('chatMessage', txtChat.val());
    }//If non-empty message, send outbound socket
    txtChat.val('');//Clear message
}

//eslint-disable-next-line no-unused-vars
function toggleReady()
{
    socket.emit('lobbyReady', null);
    const readyButton = $('#btnReady');
    if ('Ready' === readyButton.html())
    {
        readyButton.html('Unready');
        readyButton.removeClass('btn-success');
        readyButton.addClass('btn-danger');
    }
    else
    {
        readyButton.html('Ready');
        readyButton.addClass('btn-success');
        readyButton.removeClass('btn-danger');
    }//Changes button and toggles ready status
}

$().ready(() =>
{
    $('#modalName').modal('show');//Show modal on load

    $('#formJoin').submit((e) => submitName(e));//Handle join submission
    $('#formChat').submit((e) => sendMessage(e));//Handle chat submission
});

function addLog(message)
{
    $('#listChatLog').append(Mustache.render($('#chatTemplate').html(), { message }));
    const chatLog = $('#divChatLog');
    chatLog[0].scrollTop = chatLog[0].scrollHeight - chatLog[0].clientHeight;//Scroll to bottom on new message
}

socket.on('chatMessage', (message) =>
{
    addLog(message);
});//On chat message, add to chat log

socket.on('gameMessage', (message) =>
{
    addLog(message);
});//On game message, add to log

socket.on('lobbyUpdate', (lobbyData) =>
{
    const lobby = $('#listLobby');
    lobby.empty();
    const template = $('#lobbyTemplate').html();
    Object.keys(lobbyData).forEach((user) =>
    {
        lobby.append(Mustache.render(template, { name: lobbyData[user].name, ready: lobbyData[user].ready }));
    });//Add all named users to lobby list
});

function updatePlayerList(players)
{
    const playersList = $('#listPlayers');
    playersList.empty();
    const template = $('#playerTemplate').html();
    Object.keys(players).forEach((player) =>
    {
        playersList.append(
            Mustache.render(
                template,
                {
                    name: players[player].name,
                    team: players[player].team,
                    isRevealedTeam: ('Monster' === players[player].team && 'Monster' === players[socket.id].team) || players[player].isRevealedTeam, //Monsters are revealed to eachother and heroes who have been on a quest are revealed and certain causes of death reveal a team
                    dead: players[player].dead,
                },
            ),
        );
    });//Add players to player list
}

socket.on('gameStart', (players) =>
{
    $('#modalLobby').modal('hide');//Hide lobby
    $('#lblRole').html(`You are the ${players[socket.id].team}, ${players[socket.id].role}`);
    updatePlayerList(players);
});

function activatePlayerSelect(clients, addNone)
{
    $('#divPlayerSelect').show();
    const playerOptions = $('#divPlayerOptions');
    playerOptions.empty();
    const template = $('#playerSelectTemplate').html();
    Object.keys(clients).filter((client) => false === clients[client].dead).forEach((client) =>
    {
        playerOptions.append(Mustache.render(template, { name: clients[client].name, id: client }));
    });//Create list of player radio buttons
    if (true === addNone)
    {
        playerOptions.append(Mustache.render(template, { name: 'None', id: -1 }));
    }//Add option for no choice if flag set
}

function sendQuest(e)
{
    e.preventDefault();
    socket.emit('questTarget', $('input[name="selectedPlayer"]:checked').val());//Sends targeted player name to server
    $('#divPlayerSelect').hide();
}

socket.on('promptQuest', (clients) =>
{
    activatePlayerSelect(clients, false);
    $('#formPlayerSelect').unbind().submit((e) => sendQuest(e));
});//Will turn on player selection form and bind form to quest

function vote(result)
{
    $('#divVote').hide();
    socket.emit('voteResult', result);
}

socket.on('startVote', (target) =>
{
    $('#divVote').show();
    $('#btnVoteYay').unbind().on('click', () => vote(true));
    $('#btnVoteNay').unbind().on('click', () => vote(false));
    $('#lblVoteTarget').html(`Vote to send a quest to slay ${target}`);
});
