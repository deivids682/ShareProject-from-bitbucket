<template>
  <list-my-tasks :service="'allMyTasks'"></list-my-tasks>
</template>

<script>
import ListMyTasks from '@/comp/ListMyTasks.vue';

export default {
  components: {
    ListMyTasks,
  },
};
</script>

