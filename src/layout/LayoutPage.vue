<template>
    <div class="layout-container">
        <header class="page-header bg-primary">
            <button v-b-toggle.sidebar-menu class='back-btn'>
              <i class="fa fa-bars fa-2x"></i>
            </button>
            <span class="page-title">Cypto App with ML</span>
            <b-sidebar id="sidebar-menu" title="Dashboard" shadow class='col-2'>
              <template>
                <div class="p-3">
                  <nav class="mb-3">
                    <b-nav pills vertical>
                      <b-nav-item to="/" exact exact-active-class="active">Home</b-nav-item>
                      <b-nav-item to="/view/BTCUSDT" exact exact-active-class="active">BTCUSDT</b-nav-item>
                      <b-nav-item to="/view/ETHUSDT" exact exact-active-class="active">ETHUSDT</b-nav-item>
                      <b-nav-item to="/view/BNBUSDT" exact exact-active-class="active">BNBUSDT</b-nav-item>
                      <!-- <b-nav-item to="/view/DOTUSDT" exact exact-active-class="active">DOTUSDT</b-nav-item> -->
                      <b-nav-item to="/view/BTCEUR" exact exact-active-class="active">BTCEUR</b-nav-item>
                      <b-nav-item to="/view/ETHEUR" exact exact-active-class="active">ETHEUR</b-nav-item>
                      <b-nav-item to="/view/BNBEUR" exact exact-active-class="active">BNBEUR</b-nav-item>
                      <!-- <b-nav-item to="/view/DOTEUR" exact exact-active-class="active">DOTEUR</b-nav-item> -->
                    </b-nav>
                  </nav>
                  <!-- <b-button variant="primary" block @click="hide">Close</b-button> -->
                </div>
              </template>
            </b-sidebar>
        </header>
        <div class="page-container">
            <transition name="fade" mode="out-in">
                <keep-alive include="dashboard">
                    <router-view/>
                </keep-alive>
            </transition>
        </div>
    </div>
</template>
<script>
  export default {
    name: 'LayoutPage',
    data() {
      return {
        currentPage: 'dashboard'
      }
    },
    watch: {
      '$route': {
        deep: true,
        handler: function (page) {
          this.currentPage = page.name;
        }
      }
    }
  }
</script>