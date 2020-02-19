<template>
  <list-my-tasks :service="'bfh'"></list-my-tasks>
</template>

<script>
import ListMyTasks from '@/comp/ListMyTasks.vue';

export default {
  components: {
    ListMyTasks,
  },
};
</script>

