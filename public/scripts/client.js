//eslint-disable-next-line no-undef
const socket = io();//Connect to serverside socket

function submitName(e)
{
    e.preventDefault();//Prevent postback
    socket.emit('setName', $('#txtName').val());//Submit name to server
    $('#modalName').modal('hide');//Hide modal after submission
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

$().ready(() =>
{
    $('#modalName').modal('show');//Show modal on load

    $('#formJoin').submit((e) => submitName(e));//Handle join submission
    $('#formChat').submit((e) => sendMessage(e));//Handle chat submission
});

socket.on('chatMessage', (message) =>
{
    $('#listChatLog').append($('<li></li>').addClass('list-group-item').html(message));
    const chatLog = $('#divChatLog');
    chatLog[0].scrollTop = chatLog[0].scrollHeight - chatLog[0].clientHeight;
});//On chat message, add to chat log
