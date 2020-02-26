# Material skin for SlimServer (Logitech Media Server)

![Now Playing](screenshots/now-playing.png)

The [Screenshots wiki page](https://github.com/CDrummond/lms-material/wiki/Screenshots) has more screenshots.

For more information, please refer to the [User Guide](https://cdn.statically.io/gh/d6jg/material-documentation/master/html/Material%20Skin.html).
This guide is on a separate github page, and is authored by Jim Gooch.

## Features

1. Mobile and desktop layouts
2. Browse local library - Artists, Album Artists (if not set for single list),
   Genres, Playlists, Years, Composers, etc.
3. Add random albums of artist, genre, or year
4. Browse Radio, Favourites, and Apps
5. Add, delete, and edit favourites
6. Add, delete, rename, and edit playlists
7. Now playing
8. Play queue with drag'n'drop editing
9. UI settings; light, coloured, dark, and black themes, 18 different colour
   schemes, album sort, auto scroll play queue
10. Player settings; crossfade, replay gain, don't stop the music, alarms
11. Server settings
12. Sync support
13. Info dialog to show stats, and re-scan music
14. Manage players; control volume, play/pause, show current track
15. Group player control; add, edit, delete
16. Pin apps, etc., to main screen
17. Swipe left/right to change views with mobile layout
18. Lock screen controls when used with Chrome on Android
19. Integrated support for "Music and Artist Information" plugin
20. Search for podcasts on iTunes or GPodder
21. Move queue between players

## Installation

1. Open the LMS web page (e.g. `http://localhost:9000`)
2. Click on Settings
3. Select the Plugins tab
4. At bottom of the page add the repo URL: `https://raw.githubusercontent.com/CDrummond/lms-material/master/public.xml`
5. Install the plugin and enable as usual

NOTE: This should no longer be necessary, as Material is now an official
3rd-party add-on.

## Usage

1. Access the skin through `http://<yourserver>:9000/material/`
2. Select "Add to Home screen" on your device, if supported.

### Selecting mobile or desktop

Material should automatically choose mobile or desktop layouts, but you may also
force one or the other.

* `http://<yourserver>:9000/material/?layout=mobile` will force mobile layout
* `http://<yourserver>:9000/material/?layout=desktop` will force desktop layout

You can also launch Material straight into its desktop now-playnig screen, using:

* `http://<yourserver>:9000/material/now-playing`

### Selecting start-up player

Material will restore the previously used player on start-up. To accomplish
this, it stores the player's ID (its MAC address) in your browser's local
storage. If you clean cookies, etc, then this setting will be cleared. As an
alternative, you can specify the player's name (URL encoded) or its MAC address
in Material's URL as follows:

* `http://<yourserver>:9000/material/?player=Player%20Name`
* `http://<yourserver>:9000/material/?player=01:02:03:04:05:06`

### Selecting initial page

Material will start on the last used page by default. For the mobile layout, you
may specify the initial page in the URL query. Valid values are; `browse`,
`now-playing`, and `queue`. e.g:

* `http://<yourserver>:9000/material/?page=now-playing`

### Actions

You can specify a set 'actions' to be triggered when the page is loaded. This
is achieved by passing the `action` query parameter one or more times. This uses
the following syntax:

* `http://<yourserver>:9000/material/?action=name/comma-separated-params/player`

`name` being the name of the action, `comma-separated-params` is (as its name
implies) a list of comma-separated parameters to pass to the invoked action,
`player` allows you to (optionally) specify that the action will only occur when
the indicated player is present.

* `http://<yourserver>:9000/material/?layout=desktop&action=expandNowPlaying/true` will
open the desktop-layout with the now-playing page expanded (which is similar to
`http://<yourserver>:9000/material/now-playing`)

* `http://<yourserver>:9000/material/?layout=mobile&action=dlg.open/playersettings,-,alarms`
will open the player settings dialog, and scroll the 'Alarms' section into view.
`-` is used to tell the player settings dialog to act on the currently active
player. Therefore, to be truly useful the `player=` query parameter should also
be used. e.g. `http://<yourserver>:9000/material/?layout=mobile&player=Bedroom&action=dlg.open/playersettings,-,alarms`

### Debugging

Material uses LMS's JSONRPC and Cometd interfaces to send commands and receive
updates. To see (some) of the messages Material sends, and the messages
received, start Material as follows:

* `http://<yourserver>:9000/material/?debug=json` for JSONRPC
* `http://<yourserver>:9000/material/?debug=cometd` for Cometd
* `http://<yourserver>:9000/material/?debug=json,cometd` for both

### Cache

Material caches artist and album lists, to speed up subsequent listings. To
clear this cache, start Material as follows:

* `http://<yourserver>:9000/material/?clearcache=true`

### Customisation

You may install CSS files within your LMS's `prefs/plugin` folder to modify the
look or layout of Material. Each layout (desktop & mobile) will look for its own
custom css file. These should be named as follows:

* `prefs/plugin/material-skin.desktop.css`
* `prefs/plugin/material-skin.mobile.css`

You may also specify the custom CSS as part of Material's URL, therefore allowing
per-device CSS changes. e.g.

* `http://<yourserver>:9000/material/?css=my-phone` will use `prefs/plugin/material-skin.my-phone.css` as the custom CSS file.

### Custom menu entries

Material will look for `material-skin.actions.json` within your LMS's `prefs/plugin`
folder. If found, then Material will add the actions listed in the `system` section
to the main menu, actions in `allplayers` to all players, or you may create a section
matching a specific player's MAC address. This file has the following format:

```
{
  "system":[
    {
      "title":"A page to embed in Material",
      "iframe":"http://address/to/embed",
      "locked":true
    },
    {
      "title":"A page to launch in a new window/tab",
      "weblink":"http://some/site"
    }
    {
      "title":"A command to run on the LMS server",
      "command":"ls /tmp/ &"
    }
  ],
  "allplayers":[
    {
      "title":"A command to run on the LMS server",
      "command":"echo \"Player MAC:$ID Player Name:$NAME\""
    }
  ]
  "ab:cd:de:01:02:03":[
    ...
  ]
}
```

`iframe` URLs are loaded within Material (as happens for server settings, etc),
and `weblink` URLs are loaded in a new window (or tab).

`"locked":true` will hide the action until the password entered in Material's
settings page matches that set in the Material Skin server settings.

`$ID` will be replaced by the player's ID (its MAC address), and `$NAME` will
be replaced by the player's name. NOTE: No validation takes place, and commands
are invoked as is. Use `&` to run a command in the background - otherwise you
could stall LMS.

If you have multiple players, then player actions will be accessible from the
'Manage players' dialog, otherwise they will be listed at the bottom of the
'Player settings' dialog.

## Donations

I develop this skin purely for fun, so no donations are required. However, seeing as I have been asked about this a few times, here is a link...

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=2X2CTDUH27V9L&source=url)
