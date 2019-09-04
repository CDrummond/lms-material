# Material skin for SlimServer (Logitech Media Server)

NOTE: The following screenshot is from the 0.0.1 release, and there have been
a few changes since.

![Now Playing](screenshots/now-playing.png)

See https://github.com/CDrummond/lms-material/wiki/Screenshots for more screenshots.

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
9. UI settings; dark theme, album sort, auto scroll play queue
10. Player settings; crossfade, replay gain, don't stop the music, alarms
11. Sync support
12. Info dialog to show stats, and re-scan music
13. Manage players; control volume, play/pause, show current track
14. Group player control; add, edit, delete
15. Pin apps, etc., to main screen
16. Swipe left/right to change views with mobile layout
17. Lock screen controls when used with Chrome on Android
18. Integrated support for "Music and Artist Information" plugin

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

* `http://<yourserver>:9000/material/mobile?auto=false` will force mobile layout
* `http://<yourserver>:9000/material/desktop?auto=false` will force desktop layout

Material also has two other views; a mini-player and now-playing screen. The
mini-player can be launched via the desktop view (and this is how it is intended
to be used), or via the URL below. Now-playing can only be accessed via the URL
below (it is in fact a trimmed down desktop view, that only shows now-playing).

* `http://<yourserver>:9000/material/mini`
* `http://<yourserver>:9000/material/now-playing`

### Selecting start-up player

Material will restore the previously used player on start-up. To accomplish
this, it stores the player's ID (its MAC address) in your browser's local
storage. If you clean cookies, etc, then this setting will be cleared. As an
alternative, you can specify the player's name (URL encoded) or its MAC address
in Material's URL as follows:

* `http://<yourserver>:9000/material/?player=Player%20Name`
* `http://<yourserver>:9000/material/?player=01:02:03:04:05:06`

### Selecting start-up page

Material will start on the last used page by default. For the mobile layout, you
may specify the initial page in the URL query. Valied values are; `browse`,
`now-playing`, and `queue`. e.g.:

* `http://<yourserver>:9000/material/mobile?page=now-playing`

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

## Donations

I develop this skin purely for fun, so no donations are required. However, seeing as I have been asked about this a few times, here is a link...

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=2X2CTDUH27V9L&source=url)
