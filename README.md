# Material skin for SlimServer (Logitech Media Server)

**NOTE** This is currently under development, and is not ready for regular
usage.

![Browse](screenshots/browse.png)
![Now Playing](screenshots/now-playing.png)
![Queue](screenshots/queue.png)


## Features

1. Browse local library - Artists, Album Artists (if not set for single list),
   Genres, Playlists, Years, Composers, etc.
2. Browse Radio, Favourites, and Apps
3. Add, delete, and rename favourites
4. Add, delete, and rename playlists
5. Now playing
6. Play queue with drag'n'drop editing
7. Swipe left/right on mobile to change views
8. UI settings; dark theme, album sort, auto scroll play queue
9. Player settings; crossfade, replay gain, dont stop the music, alarms
10. Sync support
11. Info dialog to show stats, and re-scan music
12. Manage players; control volume, play/pause, show current track

## Installation

Using LMS GUI:

1. Open the LMS web page (e.g. `http://localhost:9000`)
2. Click on Settings
3. Select the Plugins tab
4. At bottom of the page add the repo URL: `https://raw.githubusercontent.com/CDrummond/lms-material/master/public.xml`
5. Install the plugin and enable as usual

Manually:

Copy (or symlink) the ```MaterialSkin``` directory into the server's `Plugin` directory.


## Usage

1. Access the skin through `http://<yourserver>:9000/material/`
2. Select "Add to Home screen" on your device, if supported.


## Testing

The skin may be installed on a machine separate to LMS. Currently this 
is how its developed. e.g.

1. cd in the `material` folder
2. Start python's simple HTTP server - e.g. `python -m SimpleHTTPServer`
3. Access on localhost via `http://localhost:8000/?lms=192.168.0.1` 
   (replace `192.168.0.1` with the IP address of the LMS server)

