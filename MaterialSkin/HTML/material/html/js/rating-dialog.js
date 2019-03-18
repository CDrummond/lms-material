/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-rating-dialog', {
    template: `
<v-dialog scrollable v-model="show" persistent width="350">
 <v-card>
  <v-card-title>{{title}}</v-card-title>
  <v-card-text>
   <v-layout text-xs-center row wrap>
    <v-flex xs12 class="np-text">
     <v-rating large v-if="maxRating>5" v-model="value" half-increments hover clearable></v-rating>
     <v-rating large v-else v-model="value" hover clearable></v-rating>
    </v-flex>
   </v-layout>
  </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat @click.native="apply()">{{i18n('Apply')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            title: "",
            value: 0,
            item: undefined
        }
    },
    computed: {
            maxRating() {
            return this.$store.state.maxRating
        }
    },
    mounted() {
        bus.$on('rating.open', function(ids, current) {
            this.ids = ids;
            if (ids.length>1) {
                this.title=i18n("Set rating for %1 tracks", ids.length);
            } else {
                this.title=i18n("Set rating");
            }
            this.value = undefined==current ? 3 : current;
            this.toSet = undefined;
            this.show = true;
        }.bind(this));
    },
    methods: {
        cancel() {
            if (this.toSet) {
                return;
            }
            this.show=false;
        },
        apply() {
            if (this.toSet) {
                return;
            }
            this.toSet = [];
            this.ids.forEach(i => {
                this.toSet.push(i.split(":")[1]);
            });
            this.setRating();
        },
        setRating() {
            if (this.toSet.length==0) {
                this.toSet = undefined;
                this.show=false;
                bus.$emit('ratingsSet', this.ids, this.value);
            } else {
                lmsCommand(this.$store.state.player.id, ["trackstat", "setrating", this.toSet[0], adjustRatingToServer(this.value)]).then(({data}) => {
                    this.toSet.shift();
                    this.setRating();
                });
            }
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        }
    }
})

