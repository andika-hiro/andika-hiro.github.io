<script>
  import Navbar from "./component/Navbar.svelte";
  import Main from "./component/Main.svelte";
</script>

<main>
  <Navbar />
  <Main />
</main>

<style>
  /* Font */
  @import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap");

  * {
    font-family: "Roboto", sans-serif;
  }

  main {
    width: 100%;
  }
</style>
