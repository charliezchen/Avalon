const Express = require("express")();
const Http = require('http').Server(Express);
const Sock = require("socket.io")(Http, {
    cors: {
        origin: "*",
        methods: ['POST', 'GET']
        // transports: ['websocket']
    }
});

Sock.use((socket, next) => {
    const name = socket.handshake.auth.name;
    if (!name) {
        return next(new Error("invalid name"));
    }
    socket.name = name;
    next();
})

ALL_IDENTITIES = ['Merlin', 'Assasin', 'Percival', 'Morganna', 'Oberon', 'Loyal Servants of Arthor', 'Loyal Servants of Arthor', 'Oberon/Minions', 'Minnions of Mordred']

Sock.on("connection", socket => {
    const users = [];
    for (let [id, socket] of Sock.of("/").sockets) {
        users.push({
            userID: id,
            name: socket.name
        })
    }
    socket.emit("users", users);

    socket.broadcast.emit("user connected", {
        userID: socket.id,
        name: socket.name
    })

    socket.on("disconnect", () => {
        socket.broadcast.emit("user disconnected", socket.id);
    });

    socket.on("start", () => {
        console.log("receive start")
        const users = [];
        for (let [id, socket] of Sock.of("/").sockets) {
            users.push({
                userID: id,
                name: socket.name,
                sock: socket
            })
        }
    
        let arr = [];
        for (let i = 0; i < users.length; i++) {
            arr.push(i);
        }
        arr = shuffle(arr);
    
        for (const [index, user] of users.entries()) {
            user.sock.emit("identity", ALL_IDENTITIES[arr[index]])
        }
    
    
    })
})
function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}



// let num = 0;

// Sock.on("connection", socket => {
//     socket.emit("sess", {"num": num});
// })

// Sock.on("join", socket => {
//     num += 1;

// })

Http.listen(3000, () => {
    console.log("Listening at :3000...");
})

