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

socket.on('chatMessage', (message) =>
{
    $('#listChatLog').append(Mustache.render($('#chatTemplate').html(), { message }));
    const chatLog = $('#divChatLog');
    chatLog[0].scrollTop = chatLog[0].scrollHeight - chatLog[0].clientHeight;//Scroll to bottom on new message
});//On chat message, add to chat log

socket.on('lobbyUpdate', (lobbyData) =>
{
    const lobby = $('#listLobby');
    lobby.empty();
    Object.keys(lobbyData).forEach((user) =>
    {
        lobby.append(Mustache.render($('#lobbyTemplate').html(), { name: lobbyData[user].name, ready: lobbyData[user].ready }));
    });//Add all named users to lobby list
});

socket.on('gameStart', (players) =>
{
    $('#modalLobby').modal('hide');//Hide lobby
    $('#lblRole').html(`You are the ${players[socket.id].team}, ${players[socket.id].role}`);
    const playersList = $('#listPlayers');
    Object.keys(players).forEach((player) =>
    {
        playersList.append(
            Mustache.render(
                $('#playerTemplate').html(),
                {
                    name: players[player].name,
                    team: players[player].team,
                    isRevealedTeam: ('Monster' === players[player].team && 'Monster' === players[socket.id].team) || players[player].isRevealedHero, //Monsters are revealed to eachother and heroes who have been on a quest are revealed
                },
            ),
        );
    });//Add players to player list
});
