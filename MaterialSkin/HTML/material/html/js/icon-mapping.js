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
    "/inbox.png":{"svg":"left-arrow"},
    "/playlist.png":{"icon":"list"},
    "/toptracks.png":{"svg":"trophy"},
    "/account.png":{"icon":"person"},
    "/artists.png":{"svg":"artist"},
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
                item.image=item[value]=item.svg=undefined; item.icon=value['icon'];
            } else if (value['svg']) {
                item.image=item[value]=item.icon=undefined; item.svg=value['svg'];
            }
            return true;
        }
    }
    for (const [key, value] of Object.entries(INDEXOF_MAP)) {
        if (item[type].indexOf(key)>0) {
            if (value['icon']) {
                item.image=item[value]=item.svg=undefined; item.icon=value['icon'];
            } else if (value['svg']) {
                item.image=item[value]=item.icon=undefined; item.svg=value['svg'];
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
