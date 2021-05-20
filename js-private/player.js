function keyify(arbitary_key) {
    var key = arbitary_key.repeat(16).slice(0, 16)
    key = CryptoJS.enc.Utf8.parse(key);
    return key
}

function decrypt(ciphertextStr, arbitary_key) {
    var key = keyify(arbitary_key);
    var ciphertext = CryptoJS.enc.Base64.parse(ciphertextStr);

    // split IV and ciphertext
    var iv = ciphertext.clone();
    iv.sigBytes = 16;
    iv.clamp();
    ciphertext.words.splice(0, 4); // delete 4 words = 16 bytes
    ciphertext.sigBytes -= 16;

    // decryption
    var decrypted = CryptoJS.AES.decrypt({
        ciphertext: ciphertext
    }, key, {
        iv: iv
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

function grand_key_acquisition(player) {
    var keyPrefix = "key://";
    var urlTpl = "https://softculture-streaming.s3-eu-west-1.amazonaws.com/{key}";

    player.on("loadstart", function(e) {
        player.tech().hls.xhr.beforeRequest = function(options) {
            // required for detecting only the key requests
            if (!options.uri.startsWith(keyPrefix)) {
                return;
            }
            options.headers = options.headers || {};
            options.headers["Custom-Header"] = "value";
            options.uri = urlTpl.replace("{key}", options.uri.substring(keyPrefix.length));
        };
    });
}

/* Функция создания адреса файла */
function address(file, slug, selfmade, html5 = false, zip = false) {
    /* Данные из Amazon Cloudfront */
    var webDist = "https://d35raauzs56ob1.cloudfront.net/";
    var hlsDist = "https://d2mtbe6k2can1m.cloudfront.net/";
    var zipDist = "https://d3kif91e92qv66.cloudfront.net/";
    var selectelDist = "https://251532c8-0785-4107-9b32-87fe9191dd35.selcdn.net/";

    if (zip) {
        return zipDist + decrypt(file.trim(), slug);
    }

    if (selfmade) {
        var folder = "video/";
    } else {
        var folder = "";
    }

    if (html5) {
        return webDist + folder + decrypt(file.trim(), slug);
    } else {
        var path = decrypt(file.trim(), slug);
        path = path.slice(0, -4);
        path = path + "/index.m3u8"
        return selectelDist + folder + path;
    }
}

// Функция создания плеера без плейлиста Videojs
function singlePlayer(json, slug, html5 = true) {
    var overrideNative = true;
    var setup = {
        controls: true,
        width: "100%",
        height: "100%",
        preload: "auto",
        aspectRatio: "16:9",
        fluid: true,
        playbackRates: [1, 1.25, 1.5],
        html5: {
          hls: {
            overrideNative: overrideNative
          },
          nativeVideoTracks: !overrideNative,
          nativeAudioTracks: !overrideNative,
          nativeTextTracks: !overrideNative
        }
    };
    if (html5) {
        var src = address(json["path"], slug, json['selfmade'], html5 = true);
        setup.sources = [{
            src: src,
            type: 'video/mp4'
        }];
    } else {
        var src = address(json["path"], slug, json['selfmade'], html5 = false);
        setup.sources = [{
            src: src,
            type: "application/x-mpegURL"
        }];
    }

    var chapters = false;

    // // Chapters - только для внутренних видео
    // if (json['chapters']){
    //     var chapters_file = src.substr(0, src.lastIndexOf(".")) + ".vtt";
    //     chapters = {kind:"chapters", src:chapters_file, srclang:"en"};
    // }

    if (typeof player !== 'undefined') {
        if (chapters) {
          player.pause();
        } else {
          player.reset()
        }

        player.src({
            type: setup.sources[0].type,
            src: setup.sources[0].src
        });
        player.load();
        player.play();
        if (chapters) {
            player.on('nuevoReady', function() {
                player.loadTracks(chapters);
            });
        }
    } else {
        player = videojs('mediaplayer', setup);
        player.seekButtons({
           forward: 10,
           back: 10
       });
        if (!html5) {
            player.hlsQualitySelector();
            grand_key_acquisition(player);
        }
        if (chapters) {
            player.on('nuevoReady', function() {
                player.loadTracks(chapters);
            });
        }
    }
}

// Функция создания кнопки
function createButton(name, value, spanned = false) {
    var button = document.createElement('button');
    if (spanned) {
        var span = document.createElement('span')
        span.innerHTML = name;
        button.appendChild(span);
    } else {
        var t = document.createTextNode(name);
        button.appendChild(t);
    }
    button.type = 'button';
    button.value = value;
    return button;
}

// Функция отображения списка видео для одного занятия
function showLesson(id) {
    var current_lesson = document.getElementById(id);
    var list = document.getElementById("medialist");
    list.insertBefore(current_lesson, list.childNodes[0]);
}

// Создание кнопки для занятий
function createLesson(lesson, menu) {
    var lesson_button = createButton((lesson), "opt" + lesson.toString());
    lesson_button.addEventListener("click", function() {
        showLesson(this.value);
        var current = menu.getElementsByClassName("active");
        if (current.length > 0) {
            current[0].className = current[0].className.replace(" active", "");
        }
        this.className += " active";
    })

    if (lesson == 1) {
        lesson_button.className += " active";
    }

    return lesson_button //{
}

// Создание списка видео внутри одного занятия
function createVideo(video_json, list, tech, slug) {
    var video_button = createButton(video_json['title'], JSON.stringify(video_json), true);

    video_button.addEventListener("click", function() {
        let json = JSON.parse(this.value);
        if (json.zip) {
            let zip_url = address(json.path, slug, json.selfmade, html5=false, zip=true);
            let zip_frame = $("<iframe/>").attr({
                src: zip_url,
                style: "visibility:hidden;display:none"
            }).appendTo(video_button);
        } else {
            singlePlayer(json, slug, html5 = tech);
        }
        let current = list.getElementsByClassName("active");
        if (current.length > 0) {
            current[0].className = current[0].className.replace(" active", "");
        }
        this.className += " active";
    })

    return video_button
}

// Создание меню с видео
function createMedialist(data, slug, menu_id, list_id) {
    var list = document.getElementById(list_id);
    var menu = document.getElementById(menu_id);

    var videos = data['result']['video']
    var tech = data['result']['tech']

    for (i = 0; i < videos.length; i++) {
        let lesson = videos[i]['lesson'];
        let files = videos[i]['files'];

        let lesson_button = createLesson(lesson, menu);
        var video_list = document.createElement('div');
        video_list.className = "option";
        video_list.id = "opt" + lesson.toString();

        for (j = 0; j < files.length; j++) {
            let file = files[j];
            let video_element = createVideo(file, list, tech, slug);
            if (lesson == 1 && j == 0) {
                video_element.className += " active";
            }
            video_list.appendChild(video_element);
        }

        menu.append(lesson_button);
        list.append(video_list);
    }
}
