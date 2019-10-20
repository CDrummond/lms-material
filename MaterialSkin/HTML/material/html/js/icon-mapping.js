const ENDSWITH_MAP = {
    "/bbciplayer.png":{"svg":"bbc-iplayer"},
    "/bbciplayerextra.png":{"svg":"bbc-iplayer"},
    "/radiopresets.png":{"icon":"favorite"},
    "/radiolocal.png":{"icon":"my_location"},
    "/language.png":{"icon":"language"},
    "/radiomusic.png":{"icon":"music_video"},
    "/radiosports.png":{"icon":"sports_soccer"},
    "/radionews.png":{"icon":"menu_book"},
    "/radiotalk.png":{"icon":"chat"},
    "/radioworld.png":{"icon":"public"},
    "/podcasts.png":{"icon":"rss_feed"},
    "/radiosearch.png":{"icon":"search"},
    "/radiofeeds.png":{"svg":"radio-tower"},
    "/album.png":{"icon":"album"},
    "/search.png":{"icon":"search"},
    "/playlist-collab.png":{"icon":"list_alt"},
    "/account.png":{"icon":"account_circle"},
    "/inbox.png":{"icon":"chevron_left"},
    "/playlist.png":{"icon":"list"},
    "/toptracks.png":{"icon":"trending_up"},
    "/account.png":{"icon":"person"},
    "/artists.png":{"avg":"artist"},
    "/whatsnew.png":{"icon":"new_releases"}
};

const INDEXOF_MAP = {
    "www.jazzfm.com":{"svg":"saxophone"}
};

function mapIconType(item, type) {
    if (undefined==item[type]) {
        return false;
    }
    for (const [key, value] of Object.entries(ENDSWITH_MAP)) {
        if (item[type].endsWith(key)) {
            if (value['icon']) {
                item.icon=value['icon']; item.image=undefined;
            } else if (value['svg']) {
                item.svg=value['svg']; item.image=undefined;
            }
            return true;
        }
    }
    for (const [key, value] of Object.entries(INDEXOF_MAP)) {
        if (item[type].indexOf(key)>0) {
            if (value['icon']) {
                item.icon=value['icon']; item.image=undefined;
            } else if (value['svg']) {
                item.svg=value['svg']; item.image=undefined;
            }
            return true;
        }
    }
    return false;
}

function mapIcon(item, fallbackIcon) {
    if (!mapIconType(item, "icon-id") && !mapIconType(item, "icon") && undefined!=fallbackIcon) {
        item.icon=fallbackIcon; item.image=undefined;
    }
}
