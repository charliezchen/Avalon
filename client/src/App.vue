<template>
  <div id="app">
    <Avalon msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
import Avalon from './components/Avalon.vue'

export default {
  name: 'App',
  components: {
    Avalon
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
