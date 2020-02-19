// https://www.vuemastery.com/courses/next-level-vue/mixins/
export const userDataMixin = {
  data() {
    return {
      currentUserData: {},
      admin: false,
      manager: false,
      aider: false,
      sudo: false,
    };
  },
  created() {
    let userData = {};
    if (localStorage.getItem('currentUserData')) {
      try {
        userData = JSON.parse(localStorage.getItem('currentUserData'));
      } catch (e) {
        console.log(e);
      }
    } else {
      userData['displayName'] = 'system user';
      userData['role'] = '[aider]';
      userData['userId'] = 'systemUser';
    }
    this.currentUserData = Object.assign({}, userData);
    const userRole = userData.role;
    if (userRole.indexOf('admin') !== -1) {
      this.admin = true;
    }
    if (userRole.indexOf('manager') !== -1) {
      this.manager = true;
    }
    if (userRole.indexOf('aider') !== -1) {
      this.aider = true;
    }
    if (userRole.indexOf('sudo') !== -1) {
      this.sudo = true;
    }
  },
};
