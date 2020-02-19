import Vue from 'vue';
import Router from 'vue-router';
import MyTasks from './views/users/listMyTasksToday.vue';

import * as firebase from 'firebase/app';
import 'firebase/auth';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/bfhReports',
      name: 'bfhReports',
      component: () => import('./views/bfh/bfhReports.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/',
      name: 'mytasks',
      component: MyTasks,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/nbhalltaskstoday',
      name: 'nbhalltaskstoday',
      component: () => import('./views/nbh/listAllTasksToday.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/bfhalltaskstoday',
      name: 'bfhalltaskstoday',
      component: () => import('./views/bfh/listAllTasksToday.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    // old client register
    {
      path: '/clients',
      name: 'clients',
      component: () => import('./views/clients/listClients.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    // new client register
    {
      path: '/clientregister',
      name: 'clientregister',
      component: () => import('./views/clients/clientRegister.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/houseregister',
      name: 'houseregister',
      component: () => import('./views/bfh/houseRegister.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/houseregister/:houseId',
      name: 'houseprofile',
      component: () => import('./views/bfh/houseProfile.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/houseregister/:houseId/bfhHouseTasks',
      name: 'bfhHouseTasks',
      component: () => import('./views/bfh/lpPlanHouseLifePlan.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/bfhpricegroups',
      name: 'bfhpricegroups',
      component: () => import('./views/bfh/priceGroups.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/profiling',
      name: 'profiling',
      component: () => import('./views/bfh/profiling.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/list/:collection',
      name: 'listincidents',
      component: () => import('./views/clients/incidentsListAll.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/list/:collection',
      name: 'listvitals',
      component: () => import('./views/clients/bodyVitalsListAll.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/questions',
      name: 'questions',
      component: () => import('./views/nbh/equipmentQuestions.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/equipment',
      name: 'equipment',
      component: () => import('./views/nbh/equipmentManageEquipment.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/dailyreports',
      name: 'dailyreports',
      component: () => import('./views/nbh/dailyReportsListAll.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/dailyreports/:id',
      name: 'dailyreportone',
      component: () => import('./views/nbh/dailyReportsViewOne.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/visits',
      name: 'visits',
      component: () => import('./views/nbh/visitsListAll.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/nbhreports',
      name: 'nbhreports',
      component: () => import('./views/nbh/reports.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/newclient',
      name: 'newclient',
      component: () => import('./views/clients/addNewClient.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/clientprofile/:id',
      name: 'clientprofile',
      component: () => import('./views/clients/profile.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/clientregister/:clientId',
      name: 'clientprofilen',
      component: () => import('./views/clients/clientProfile.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/clientprofile/:id/clientdailyreport/:repid',
      name: 'clientdailyreport',
      component: () => import('./views/nbh/dailyReportsClientViewOne.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/incident/:incId',
      name: 'incident',
      component: () => import('./views/clients/incidentsViewOne.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/vitals/:vitalsId',
      name: 'vitals',
      component: () => import('./views/clients/bodyVitalsViewOne.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/evaluation',
      name: 'evaluation',
      component: () => import('./views/clients/roomInspection.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/clientprofile/:clid/lifeplan',
      name: 'lifeplan',
      component: () => import('./views/clients/lpPlanClientLifePlan.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/clientprofile/:clid/bfhlifeplan',
      name: 'bfhclientlifeplan',
      component: () => import('./views/clients/bfhLpPlanClientLifePlan.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/clientprofile/:clid/houselifeplan',
      name: 'bfhHouselifeplan',
      component: () => import('./views/bfh/bfhLpPlanHouseLifePlan.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/edititem/:id',
      name: 'edititem',
      component: () => import('./views/nbh/equipmentEditItem.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/clientprofile/:clid/evaluationview/:evid/report',
      name: 'equipmentreport',
      component: () => import('./views/clients/roomInspectionReport.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('./views/admin/listUsers.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/companies',
      name: 'companies',
      component: () => import('./views/companies/companies.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/features',
      name: 'featrues',
      component: () => import('./views/admin/featuresRoadmap.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/cleanings',
      name: 'cleanings',
      component: () => import('./views/cleaning/listCleanings.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/cleanings/:clientId/:cleaningId',
      name: 'cleaningsViewOne',
      component: () => import('./views/cleaning/viewCleaning.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/cleaningtasks',
      name: 'cleaningtasks',
      component: () => import('./views/cleaning/listTasks.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/cleaningtasksclient',
      name: 'cleaningtasksclient',
      component: () => import('./views/cleaning/selectClientTasks.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/clientprofile/:clid/newcleaning',
      name: 'newcleaning',
      component: () => import('./views/cleaning/newCleaning.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/clientprofile/:clid/clientTasks',
      name: 'clienttasks',
      component: () => import('./views/clients/lpSelectClientTasks.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/clientprofile/:clid/bfhclientTasks',
      name: 'bfhclienttasks',
      component: () => import('./views/clients/lpSelectbfhClientTasks.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/nbhtaskcatalog',
      name: 'nbhtaskcatalog',
      component: () => import('./views/nbh/taskCatalog.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/bfhtaskcatalog',
      name: 'bfhtaskcatalog',
      component: () => import('./views/bfh/taskCatalog.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/Nbhshifts',
      name: 'Nbhshifts',
      component: () => import('./views/nbh/shiftsManageShifts.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/bfhshifts',
      name: 'bfhshifts',
      component: () => import('./views/bfh/bfhShiftsManageshifts.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/bfhOutDays',
      name: 'bfhOutDays',
      component: () => import('./views/bfh/OutDays.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/helpvideo',
      name: 'helpvideo',
      component: () => import('./views/admin/helpVideo.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/livedashboard',
      name: 'livedashboard',
      component: () => import('./views/admin/liveAiderDashboard.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/testview',
      name: 'testview',
      component: () => import('./views/xtest/TestView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('./views/admin/login.vue'),
    },
    {
      path: 'https://ej.uz/5ocg/',
      name: 'sc7manual',
    },
  ],
});

router.beforeEach((to, from, next) => {
  const currentUser = firebase.auth().currentUser;
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // tslint:disable-next-line:max-line-length
  if (requiresAuth && !currentUser) {
    const loginpath = window.location.pathname;

    next({ name: 'login', query: { from: loginpath } });
  } else if (!requiresAuth && currentUser) {
    next('mytasks');
  } else {
    next();
  }
});

export default router;
