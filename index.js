const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const router = require('./router');

const PORT = process.env.PORT || 5000

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket)=>{ //the socket in the param is a specific instance of client socket
    console.log('new user connected');
    //socket.on can take a callback function as well as third param which can be passed from client side
    //good for error handling/running a method after the event has been emmitted from client side
    socket.on('join', ({ name, room }, callback)=>{ 
        console.log(name +" " + room)
    })
    socket.on('disconnect',()=>{
        console.log('user disconnected');
    });
});

app.use(router)

server.listen(PORT, () => {console.log(`Server has started on port ${PORT}`)})