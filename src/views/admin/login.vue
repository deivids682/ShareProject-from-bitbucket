
<template>
  <div id="login">
    <div id="firebaseui-auth-container"></div>
  </div>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/auth';
import firebaseui from 'firebaseui';

export default {
  name: 'auth',
  mounted() {
    var uiConfig = {
      signInSuccessUrl: '/',
      signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
    };
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start('#firebaseui-auth-container', uiConfig);
  },
};
</script>
