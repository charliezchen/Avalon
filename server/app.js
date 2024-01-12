const Express = require("express")();
const Http = require("http").Server(Express);
const Sock = require("socket.io")(Http, {
    cors: {
        origin: "*",
        methods: ["POST", "GET"],
    },
});

let players = [];

Sock.on("connection", (socket) => {
    socket.emit("users", players);

    socket.on("join", (name) => {
        players.push({ userID: players.length, name: name });
        socket.name = name;
        socket.emit("users", players);
        socket.broadcast.emit("users", players);
    });

    socket.on("disconnect", () => {
        players = players.filter((player) => player.name !== socket.name);
        socket.broadcast.emit("users", players);
    });
});

let currentVote = {
    proposer: null,
    selectedVoters: [],
    votes: {}
};

const game = Sock.of("/game");
game.on("connection", (socket) => {
    
    socket.on("join", (name) => {
        socket.name = name;
    })

    socket.on("start", () => {
        const users = [];
        for (let [id, socket] of Sock.of("/game").sockets) {
            users.push(socket);
        }

        const identities = generate_identities(users.length);

        for (const [index, sock] of users.entries()) {
            sock.emit("identity", identities[index]);
        }
    });
    
    socket.on("proposeVote", (selectedVoters) => {
        currentVote.proposer = socket.id;
        currentVote.selectedVoters = selectedVoters;
        currentVote.votes = {};
        game.to(currentVote.proposer).emit("voteInitiated");
        for (let [id, socket] of Sock.of("/game").sockets) {
            if (currentVote.selectedVoters.includes(socket.name)) {
                socket.emit("updateStage", "voting-vote");
            } else {
                socket.emit("updateStage", "voting-no-vote");
            }
        }
    });
    
    socket.on("submitVote", (vote) => {
        currentVote.votes[socket.id] = vote;
        if (Object.keys(currentVote.votes).length === currentVote.selectedVoters.length) {
            let voteResults = Object.values(currentVote.votes);
            let success = voteResults.filter((vote) => vote === "success").length;
            let failure = voteResults.filter((vote) => vote === "failure").length;
            game.emit("voteResults", { success, failure });
            currentVote = { proposer: null, selectedPlayers: [], votes: {} };
        }
      });
})


function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
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

    for (let i = 0; i < number_of_players; i++) {
        var identity = all_identities[permutation[i]];
        identities[i] = {
            identity: identity,
            viewerContext: [],
        };
        switch (identity) {
            case "Merlin":
                identities[i].viewerContext = merlinVC;
                percivalVC.push(i);
                break;

            case "Percival":
                identities[i].viewerContext = percivalVC;
                break;

            case "Morgana":
                percivalVC.push(i);
            case "Assasin":
            case "Lancelot":
                merlinVC.push(i);
            case "Mordred":
                identities[i].viewerContext = redVC;
                redVC.push(i);
                break;

            case "Oberon":
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
            return ["Merlin", "Percival", "Farmer", "Morgana", "Assasin"];
        case 6:
            return ["Merlin", "Percival", "Farmer", "Farmer", "Morgana", "Assasin"];
        case 7:
            return [
                "Merlin",
                "Percival",
                "Farmer",
                "Farmer",

                "Morgana",
                "Oberon",
                "Assasin",
            ];
        case 8:
            return [
                "Merlin",
                "Percival",
                "Farmer",
                "Farmer",
                "Farmer",

                "Morgana",
                "Assasin",
                "Lancelot",
            ];
        case 9:
            return [
                "Merlin",
                "Percival",
                "Farmer",
                "Farmer",
                "Farmer",
                "Farmer",

                "Mordred",
                "Morgana",
                "Assasin",
            ];
        case 10:
            return [
                "Merlin",
                "Percival",
                "Farmer",
                "Farmer",
                "Farmer",
                "Farmer",

                "Mordred",
                "Morgana",
                "Oberon",
                "Assasin",
            ];
        default:
            return [];
    }
}

const PORT = process.env.PORT || 3000;
Http.listen(PORT, () => {
    console.log("Listening at :3000...");
});
