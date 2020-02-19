<template>
  <v-container>
    <v-layout wrap>
      <v-flex xs12 sm6 offset-sm3>
        <v-card>
          <v-card-title primary-title>
            <h3>Lietošanas rokasgrāmata</h3>
          </v-card-title>
          <v-card-text class="text-center">Pamācība sistēmas lietošanā</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="info" :to="{ name: 'sc7manual'}" target="_blank">Atvērt</v-btn>
            <v-spacer></v-spacer>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
    <help-video-frame
      v-for="(url, title) in videos"
      :key="title"
      :videoTitle="title"
      :videoSource="url"
    ></help-video-frame>
  </v-container>
</template>

<script>
import HelpVideoFrame from '@/comp/HelpVideoFrame.vue';
import BackBtn from '@/comp/BackBtn.vue';
export default {
  data() {
    return {
      videos: {
        
      },
    };
  },
  components: {
    HelpVideoFrame,
    BackBtn,
  },
};
</script>
