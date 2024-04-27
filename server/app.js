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
        console.log("receive start");
        const users = [];
        for (let [id, socket] of Sock.of("/").sockets) {
            users.push({
                userID: id,
                name: socket.name,
                sock: socket
            })
        }

        const identities = generate_identities(users.length);

        for (const [index, user] of users.entries()) {
            user.sock.emit("identity", identities[index]);
        }
    })
})
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

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


/**
 * generate_identities()
 * 
 *   Function that accepts a number, and then outputs a list 
 *   of user-identity dict. 
 */
function generate_identities(number_of_players) {
    if (number_of_players < 5 || number_of_players > 10) {
        return [];
    }
    var identities = [];
    var all_identities = get_identities(number_of_players);
    var permutation = shuffle([...Array(number_of_players).keys()]);

    var merlinVC = []; // viewer context of Merlin: can see all red team
    var percivalVC = []; // viewer context of Percival: can see Merlin and Morgana
    var redVC = []; // viewer context of all red teams (excluding Oberon): can see each other
    var lancelotVC = []; // viewer context of Lancelot who can only see Morgana

    for (let i = 0; i < number_of_players; i++) {
        var identity = all_identities[permutation[i]];
        identities[i] = {
            identity: identity,
            viewerContext: [],
        };
        switch (identity) {
            case 'Merlin':
                identities[i].viewerContext = merlinVC;
                percivalVC.push(i);
                break;

            case 'Percival':
                identities[i].viewerContext = percivalVC;
                break;
            case 'Lancelot':
                merlinVC.push(i);
                identities[i].viewerContext = lancelotVC;
                redVC.push(i);
                break;

            case 'Morgana':
                percivalVC.push(i);
                lancelotVC.push(i);
            case 'Assasin':
                merlinVC.push(i);
            case 'Mordred':
                identities[i].viewerContext = redVC;
                redVC.push(i);
                break;

            case 'Oberon':
                merlinVC.push(i);
                break;
            
            default:
                break;
        }
    }

    return identities;
}

function get_identities(number_of_players) {
    switch (number_of_players) {
        case 5:
            return [
                'Merlin', 
                'Percival', 
                'Farmer', 

                'Morgana', 
                'Assasin',
            ];
        case 6:
            return [
                'Merlin', 
                'Percival', 
                'Farmer', 
                'Farmer',

                'Morgana', 
                'Assasin',
            ];
        case 7:
            return [
                'Merlin', 
                'Percival', 
                'Farmer', 
                'Farmer',

                'Morgana',
                'Oberon', 
                'Assasin',
            ];
        case 8:
            return [
                'Merlin', 
                'Percival', 
                'Farmer', 
                'Farmer',
                'Farmer',

                'Morgana', 
                'Assasin',
                'Lancelot',
            ];
        case 9:
            return [
                'Merlin', 
                'Percival', 
                'Farmer', 
                'Farmer', 
                'Farmer',
                'Farmer',

                'Mordred',
                'Morgana', 
                'Assasin',
            ];
        case 10:
            return [
                'Merlin', 
                'Percival', 
                'Farmer', 
                'Farmer', 
                'Farmer',
                'Farmer',

                'Mordred',
                'Morgana',
                'Oberon', 
                'Assasin',
            ];
        default:
            return [];
    }
}





// let num = 0;

// Sock.on("connection", socket => {
//     socket.emit("sess", {"num": num});
// })

// Sock.on("join", socket => {
//     num += 1;

// })
const PORT = process.env.PORT || 3000;
Http.listen(PORT, () => {
    console.log("Listening at :3000...");
})

