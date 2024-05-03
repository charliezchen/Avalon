<template>
  <div>
    <span>Avalon Game Helper 2.0</span>
    
    <div v-if="!joined">
      <p>You haven't joined</p>
      <p>Name:</p>
      <input type="text" v-model="name">
      <button v-on:click="join(name)">Create/Join</button>
    </div>
    
    <div v-if="joined">
      <p>You joined. To quit, refresh the page</p>
      <p>Name:</p>
      <input type="text" v-model="name" disabled>
      <button v-on:click="join(name)" disabled>Create/Join</button>
    </div>

    <p>There are currenly {{ all_users.length }} people in the room</p>
    <ul>
      <li v-for="u in all_users" v-bind:key="u.userID">
        {{ u.name }}
        <span v-if="u.userID === socket.id"> (you) </span>
      </li>
    </ul>

    <p v-if="is_host && all_users.length < 5">You are the host</p>
    <p v-if="all_users.length < 5">Waiting for at least 5 player to join ...</p>
    <p v-if="all_users.length >= 5 && !identity.identity">Waiting for {{ all_users[0].name }} to start the game ...</p>
    
    <button v-on:click="start()" v-if="is_host && all_users.length >= 5">Start game</button>
    <p v-if="identity.identity">Identity: {{ identity.identity }}</p>
    <p v-if="identity.identity">People you can see: {{ identity.viewerContext }}</p>
  </div>
</template>

<script>
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const serverUrl = process.env.VUE_APP_SERVER_URL || 'http://localhost:3000';
const socket = io(`${serverUrl}`, {
  autoConnect: false
})

// For debug
socket.onAny((event, ...args) => {
  console.log(event, args)
})


export default {
  name: 'Avalon',
  data() {
    return {
      clientID: uuidv4(),
      name: "",
      identity: {
        identity: "",
        viewerContext: [],
      },
      socket: socket,
      joined: false,
      all_users: [],
      is_host: false,
    }
  },
  created() {
    this.socket.auth = { name: this.clientID };
    if (!this.socket.connected) {
      this.socket.connect();
    }
    this.socket.on("connect_error", (err) => {
      this.joined = false;
      console.log(err);
    });
    this.socket.on("users", data => {
      this.all_users = data;
      this.is_host = this.all_users.length > 0 && this.all_users[0].userID === this.socket.id;
      console.log("Updated user list:", data);
    });
    this.socket.on("identity", identity => {
      console.log("Received identity", identity);
      this.identity = identity;
      this.identity.viewerContext =
        this.identity.viewerContext.map(id => this.all_users[id].name);
    });
  },
  destroyed() {
    // remove the listeners for the corresponding events
    this.socket.off("connect_error");
    this.socket.off("users");
    this.socket.off("identity");
    this.socket.disconnect();
  },
  methods: {
    join(name) {
      this.name = name;
      if (!this.socket.connected) {
        this.socket.connect();
      }
      this.socket.emit("join_room", name);
      this.joined = true;
      console.log("Joined room as: ", name);
    },
    start() {
      this.socket.emit("start");
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
