import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import {env} from '@/helpers/firebaseConfig';

// MAMA-OK brandbook https://ej.uz/37sp
let colorTheme = {
  primary: '#827090',
  secondary: '#DED9E1',
  accent: '#46687d',
  info: '#46687d', // accent
  success: '#827090', // primary
};

if (env == 'testing') {
  colorTheme = {
    primary: '#D81B60',
    secondary: '#C5CAE9',
    accent: '#80DEEA',
    info: '#46687d', // accent
    success: '#827090', // primary
  };
}

Vue.use(Vuetify);

export default new Vuetify({
  icons: {
    iconfont: 'mdi',
  },
  theme: {
    themes: {
      light: colorTheme,
      dark: colorTheme,
    },
  },
});
