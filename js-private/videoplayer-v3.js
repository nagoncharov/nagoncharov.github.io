function keyify(arbitary_key){
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
    var decrypted = CryptoJS.AES.decrypt({ciphertext: ciphertext}, key, {
        iv: iv
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

/* Функция создания адреса файла */
function address(file, slug, selfmade, html5 = false, zip = false, hls_debug = true) {
    if (hls_debug) {
      html5 = false;
      selfmade = true;
    }
    /* Данные из Amazon Cloudfront */
    var webDist = "https://d35raauzs56ob1.cloudfront.net/";
    var hlsDist = "https://d13g42gjj7lr3a.cloudfront.net/";
    var zipDist = "https://d3kif91e92qv66.cloudfront.net/";

    if (zip) {
        return zipDist + decrypt(file.trim(),slug);
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
        return hlsDist + folder + path;
    }
}

// Функция создания плеера без плейлиста Videojs
function singlePlayer(json, slug, html5 = true, hls_debug = true) {
  if (hls_debug) {
    html5 = false;
  }
    var setup = {
        controls: true,
        width: "100%",
        height: "100%",
        preload: "auto",
        aspectRatio: "16:9",
        fluid: true,
        playbackRates: [1, 1.25, 1.5]
    };

    if (html5) {
        setup.sources = [{
            src: address(json["path"], slug, json['selfmade'], html5 = true),
            type: 'video/mp4'
        }];
    } else {
        console.log("running ok");
        setup.sources = [{
            src: address(json["path"], slug, json['selfmade'], html5 = false),
            type: "application/x-mpegURL"
        }];
    }
    console.log(setup);

    if (typeof player !== 'undefined') {
        player.pause();
        player.src({
            type: setup.sources[0].type,
            src: setup.sources[0].src
        });
        player.load();
        player.play();
    } else {
        player = videojs('mediaplayer', setup);
        var keyPrefix = "key://";
        var urlTpl = "https://softculture-streaming.s3-eu-west-1.amazonaws.com/{key}";
        var playerDOM = document.getElementById('video')
        playerDOM.addEventListener('canplaythrough', function() {
          player.on("loadstart", function (e) {
            player.tech().hls.xhr.beforeRequest = function(options) {
                // required for detecting only the key requests
                if (!options.uri.startsWith(keyPrefix)) { return; }
                options.headers = options.headers || {};
                options.headers["Custom-Header"] = "value";
                options.uri = urlTpl.replace("{key}", options.uri.substring(keyPrefix.length));
            };
          });}, false);
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

    return lesson_button//{
}

// Создание списка видео внутри одного занятия
function createVideo(video_json, list, tech, slug) {
    var video_button = createButton(video_json['title'], JSON.stringify(video_json), true);

    video_button.addEventListener("click", function() {
        let json = JSON.parse(this.value);
        if (json.zip) {
            let zip_url = json.file;
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
    console.log(slug);
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
            if (lesson == 1 &&  j == 0) {
              video_element.className += " active";
            }
            video_list.appendChild(video_element);
        }

        menu.append(lesson_button);
        list.append(video_list);
    }
}
