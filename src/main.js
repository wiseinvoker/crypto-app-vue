import Vue from 'vue'
import { BootstrapVue } from 'bootstrap-vue'
import { NavPlugin } from 'bootstrap-vue'
import { SidebarPlugin } from 'bootstrap-vue'
import { ModalPlugin } from 'bootstrap-vue'
import { InputGroupPlugin } from 'bootstrap-vue'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import "./assets/vendor/font-awesome/css/font-awesome.css"
import "./assets/app.scss"
import clickOutside from "./directives/click-ouside"

Vue.config.productionTip = false;
Vue.directive("click-outside", clickOutside);

Vue.use(BootstrapVue)
Vue.use(NavPlugin)
Vue.use(SidebarPlugin)
Vue.use(ModalPlugin)
Vue.use(InputGroupPlugin)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
