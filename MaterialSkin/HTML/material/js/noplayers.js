/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
Vue.component('lms-bottombar', {
    template: `
    <v-dialog v-model="player" persistent fullscreen>
        <v-card style="width:100%; height:100%; display: flex; justify-content: center; align-items: center;">
          <table>
            <tr>
              <td style="text-align: center; padding-bottom: 32px;">
                <h2>Looing for players...</h2>
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
        player () {
            return this.$store.state.player
        }
    }
})
