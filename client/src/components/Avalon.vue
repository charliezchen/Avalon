<template>
  <div>
    <span>Avalon Game Helper</span>
    <p>Name:</p>
    <input type="text" v-model="name" />
    <button v-on:click="join(name)">Create/Join</button>

    <div v-if="name_selected">
      <p>Number of people {{ num_people }}</p>
      <ul>
        <li v-for="u in all_users" v-bind:key="u.userID">{{ u.name }}</li>
      </ul>

      <p v-if="is_host && all_users.length < 5">You are the host</p>
      <p v-if="all_users.length < 5">
        Waiting for at least 5 player to join ...
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

const socket = io("http://localhost:3000", {
  autoConnect: false,
});

// For debug
socket.onAny((event, ...args) => {
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
      socket: socket,
      name_selected: false,
      all_users: [],
      is_host: false,
    };
  },
  created() {
    this.socket.on("connect_error", (err) => {
      this.name_selected = false;
      console.log(err);
    });
    this.socket.on("users", (data) => {
      this.all_users = data;
      if (this.all_users.length == 1) this.is_host = true;
      console.log(data);
    });
    this.socket.on("user connected", (data) => {
      this.all_users.push(data);
    });
    this.socket.on("user disconnected", (userID) => {
      this.all_users = this.all_users.filter((uid) => uid.userID != userID);
      console.log(this.all_users);
    });
    this.socket.on("identity", (identity) => {
      console.log("receive identity", identity);
      this.identity = identity;
      this.identity.viewerContext = this.identity.viewerContext.map(
        (id) => this.all_users[id].name
      );
    });
  },
  mounted() {
    // diff?
  },
  destroyed() {
    socket.off("connect_error");
  },
  computed: {
    num_people() {
      return this.all_users.length;
    },
  },
  methods: {
    join(name) {
      this.name_selected = true;
      this.socket.auth = { name };
      this.socket.connect();

      // this.socket.on("position", data => {
      //     console.log(data)
      // })

      console.log("name", name);
    },
    start() {
      console.log("start");
      this.socket.emit("start", 1);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
