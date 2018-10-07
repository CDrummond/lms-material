# Material skin for SlimServer (Logitech Media Server)

**NOTE** This is currently under development, and is not ready for regular
usage.

![Browse](screenshots/browse.png =270x)
![Now Playing](screenshots/now-playing.png =270x)
![Queue](screenshots/queue.png =270x)


## Features

1. Browse local library - Artists, Album Artists (if not set for single list),
   Genres, Playlists, Years, Composers, etc.
2. Browse Radio, Favourites, and Apps
3. Now playing view
4. Play queue view

## Installation

To install, simply copy (or symlink) the ```material``` directory into the
server's skin directory.

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

