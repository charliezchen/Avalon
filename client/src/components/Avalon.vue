<template>
  <div>
    <span>Avalon Game Helper</span>

    <div v-if="!name_selected">
      <p>Name:</p>
      <input type="text" v-model="name" />
      <button v-on:click="join(name)">Create/Join</button>
    </div>

    <p>Number of players: {{ num_people }}</p>
    <ul>
      <li v-for="u in all_users" v-bind:key="u.userID">{{ u.name }}</li>
    </ul>

    <div v-if="name_selected">
      <p v-if="is_host && all_users.length < 5">You are the host</p>
      <p v-if="all_users.length < 5">
        Waiting for at least 5 players to join ...
      </p>
      <p v-if="all_users.length >= 5 && !identity.identity">
        Waiting for {{ all_users[0].name }} to start the game ...
      </p>
      <button v-on:click="start()" v-if="is_host && all_users.length >= 5">
        Start game
      </button>
      <p v-if="identity.identity">Identity: {{ identity.identity }}</p>
      <p v-if="identity.identity">
        People you can see: {{ identity.viewerContext }}
      </p>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";

const room = io("http://localhost:3000", {
  autoConnect: false,
});
room.connect();
const game = io("http://localhost:3000/game", {
  autoConnect: false,
});

// For debug
game.onAny((event, ...args) => {
  console.log(event, args);
});
room.onAny((event, ...args) => {
  console.log(event, args);
});

export default {
  name: "Avalon",
  data() {
    return {
      name: "",
      identity: {
        identity: "",
        viewerContext: [],
      },
      game: game,
      room: room,
      name_selected: false,
      all_users: [],
      is_host: false,
    };
  },
  created() {
    this.room.on("name", (name) => {
      this.name = name;
      this.name_selected = true;
    });
    this.room.on("users", (data) => {
      this.all_users = data;
      if (this.all_users.length > 0 && this.all_users[0].name == this.name) {
        this.is_host = true;
      }
      console.log(data);
    });
    this.game.on("identity", (identity) => {
      console.log("receive identity", identity);
      this.identity = identity;
      this.identity.viewerContext = this.identity.viewerContext.map(
        (id) => this.all_users[id].name
      );
    });
  },
  mounted() {
  },
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
    join(name) {
      this.name_selected = true;
      this.room.emit("join", name);
      this.game.connect();
      console.log("name", name);
    },
    start() {
      console.log("start");
      this.game.emit("start", 1);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
