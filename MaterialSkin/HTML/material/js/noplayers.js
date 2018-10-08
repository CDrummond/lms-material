/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
Vue.component('lms-noplayer', {
    template: `
    <v-dialog v-model="noPlayer" persistent fullscreen>
        <v-card style="width:100%; height:100%; display: flex; justify-content: center; align-items: center;">
          <table>
            <tr>
              <td style="text-align: center; padding-bottom: 32px;">
                <h2>Looking for players...</h2>
              </td>
            </tr>
            <tr>
              <td style="text-align: center;">
                <v-progress-circular size=72 width=6 indeterminate></v-progress-circular>
              </td>
            </tr>
          </table>
        </v-card>
      </v-dialog>
`,
    props: [],
    data () {
        return { }
    },
    computed: {
        noPlayer () {
            return !this.$store.state.players || this.$store.state.players.length<1
        }
    }
})
