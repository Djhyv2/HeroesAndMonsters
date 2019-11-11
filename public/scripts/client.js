//eslint-disable-next-line no-undef
const socket = io();//Connect to serverside socket


socket.on('chatMessage', (message) =>
{
    $('#chatLogList').append($('<li></li>').addClass('list-group-item').html(message));
    const chatLog = $('#chatLog');
    chatLog[0].scrollTop = chatLog[0].scrollHeight - chatLog[0].clientHeight;
});//On chat message, add to chat log

//eslint-disable-next-line no-unused-vars
function send()
{
    const message = $('#chat').val();
    if ('' !== message)
    {
        socket.emit('chatMessage', `${socket.id}: ${message}`);
    }//If non-empty message, send outbound socket
}
