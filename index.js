const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');


const { addUser, removeUser, getUser, getUsersInRoom } = require('./users')

const router = require('./router');

const PORT = process.env.PORT || 5000

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket)=>{ //the socket in the param is a specific instance of client socket

    //socket.on can take a callback function as a second param in the arrow function which can be passed from client side
    //good for error handling/running a method after the event has been emmitted from client side
    socket.on('join', ({ name, room, profile }, callback)=>{ 
        const { error, user } = addUser({ id:socket.id, name, room, profile });

        if (error) return callback(error);

        //here we are emiting a message from the backend to the fron end
        //tells users hes welcome to chat
        socket.emit('message', { type: "Message", user: 'admin', payload: `${user.name}, welcome to the room ${user.room}` });
        
        //broadcast allows emitin an event to all other sockets connected to the server
        //.to to specify the room
        //overall tells all other members of the room user has joined
        socket.broadcast.to(user.room).emit('message', { type: "Message", user:'admin', payload:`${user.name} has joined!` })

        socket.join(user.room);

        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})

        callback();
    });

    //here we are waiting on an event from the front end (front end will emit)
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id) //client instance socket (specific user)
        io.to(user.room).emit('message', {type:message.type, user:user.name, payload:message.payload }); //sending message to fron end of all connected sockets
        callback()
    });

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('roomData', {room:user.room, users:getUsersInRoom(user.room)}); //updating users in room when someone leaves
            io.to(user.room).emit('message', {type: "Message", user: 'admin', payload:`${user.name} has left`})
        }
    });
});

app.use(router)

server.listen(PORT, () => {console.log(`Server has started on port ${PORT}`)})