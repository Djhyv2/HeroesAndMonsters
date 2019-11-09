const socket = io();//Connect to serverside socket

socket.on('chatMessage', (message) =>
{
    const chatLog = $('#chatLog');
    chatLog.append($('<li></li>').addClass('list-group-item').html(message));
    chatLog.animate({ scrollTop: chatLog.prop('scrollHeight') }, 2000);
});//On chat message, add to chat log

function send()
{
    const message = $('#chat').val();
    if ('' !== message)
    {
        socket.emit('chatMessage', `${socket.id}: ${message}`);
    }//If non-empty message, send outbound socket
}
