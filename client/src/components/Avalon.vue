<template>
  <div>
    <span>Avalon Game Helper</span>

    <!-- Section for joining the game -->
    <div v-if="!name_selected">
      <p>Name:</p>
      <input type="text" v-model="name" />
      <button v-on:click="join(name)">Create/Join</button>
    </div>

    <!-- Display the number of players -->
    <p>Number of players: {{ num_people }}</p>
    <ul>
      <li v-for="user in all_users" :key="user.userID">{{ user.name }}</li>
    </ul>

    <!-- Game actions and information after joining -->
    <div v-if="name_selected">
      <p v-if="is_host && all_users.length < 5">You are the host</p>
      <p v-if="all_users.length < 5">Waiting for at least 5 players to join ...</p>
      <p v-if="all_users.length >= 5 && !identity.identity">Waiting for {{ all_users[0].name }} to start the game ...</p>
      <button v-if="is_host && all_users.length >= 5" v-on:click="start()">Start game</button>
      <div v-if="identity.identity">
        <button @click="toggleIdentity">Show/Hide Identity</button>
        <p v-if="showIdentity">Identity: {{ identity.identity }}</p>
        <p v-if="showIdentity">People you can see: {{ identity.viewerContext }}</p>
      </div>
    </div>

    <!-- Voting -->
    <button v-if="gameStage === 'roles' && is_host" @click="proceedToNextStage">Proceed to next stage</button>
    <div v-if="gameStage === 'voting'">
      <p>Vote for the mission outcome:</p>
      <button v-if="!voteSubmitted" @click="submitVote('success')">Success</button>
      <button v-if="!voteSubmitted" @click="submitVote('failure')">Failure</button>
      <p v-if="voteSubmitted">Vote submitted. Awaiting other players...</p>
    </div>

    <!-- Displaying results -->
    <div v-if="gameStage === 'results'">
      <p>Vote Results:</p>
      <ul>
        <li v-for="(vote, index) in voteResults" :key="index">{{ vote }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";

// Socket.io connection setup
const room = io("http://localhost:3000", { autoConnect: false });
room.connect();
const game = io("http://localhost:3000/game", { autoConnect: false });

// Debugging: Log all socket events
game.onAny((event, ...args) => console.log(event, args));
room.onAny((event, ...args) => console.log(event, args));

export default {
  name: "Avalon",
  data() {
    return {
      name: "",
      identity: { identity: "", viewerContext: [] },
      game,
      room,
      name_selected: false,
      all_users: [],
      is_host: false,
      showIdentity: true,
      gameStage: '', // 'voting', 'results', etc.
      voteSubmitted: false,
      voteResults: [],
    };
  },
  created() {
    this.setupSocketListeners();
  },
  mounted() {},
  destroyed() {
    this.room.off("connect_error");
    this.game.off("connect_error");
  },
  computed: {
    num_people() {
      return this.all_users.length;
    },
  },
  methods: {
    setupSocketListeners() {
      this.room.on("name", name => {
        this.name = name;
        this.name_selected = true;
      });
      this.room.on("users", data => {
        this.all_users = data;
        this.is_host = this.all_users.length > 0 && this.all_users[0].name === this.name;
      });
      this.game.on("identity", identity => {
        this.identity = identity;
        this.identity.viewerContext = this.identity.viewerContext.map(id => this.all_users[id].name);
        this.gameStage = 'roles';
      });
      this.game.on("updateStage", stage => {
        this.gameStage = stage;
      });
      this.game.on("voteResults", voteResults => {
        this.voteResults = voteResults;
        this.gameStage = 'results';
      });
    },
    join(name) {
      this.name_selected = true;
      this.room.emit("join", name);
      this.game.connect();
    },
    start() {
      this.game.emit("start", 1);
    },
    toggleIdentity() {
      this.showIdentity = !this.showIdentity;
    },
    submitVote(vote) {
      this.voteSubmitted = true;
      this.game.emit('submitVote', vote);
    },
    proceedToNextStage() {
      this.gameStage = 'voting';
      this.game.emit('nextStage');
    },
  },
};
</script>

<!-- Placeholder for future scoped CSS -->
<style scoped>
/* Styles specific to this component */
</style>
