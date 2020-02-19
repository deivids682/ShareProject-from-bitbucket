<template>
  <list-my-tasks :service="'neighborhood'"></list-my-tasks>
</template>

<script>
import ListMyTasks from '@/comp/ListMyTasks.vue';

export default {
  components: {
    ListMyTasks,
  },
};
</script>

