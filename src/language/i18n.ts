import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { messages } from './lang';

Vue.use(VueI18n);

export let i18n = new VueI18n({
    locale: 'lv', // set locale
    fallbackLocale:'ru', // set fallback locale
    silentFallbackWarn: true, //conslole warning fix https://kazupon.github.io/vue-i18n/guide/fallback.html#fallback-interpolation
    messages, // set locale messages
});