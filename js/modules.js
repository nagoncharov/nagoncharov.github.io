// Messages
const example_data = {
    "result": {
        "tech": false,
        "video": [{
                "files": [{
                        "path": "CAP/CAP_14.3.03_L5_Cap_14.mp4",
                        "selfmade": true,
                        "title": "1-1. Interface"
                    },
                    {
                        "path": "PRT/PRT_37.23.03_L2-1_Intro.mp4",
                        "selfmade": true,
                        "title": "1-1. Interface"
                    }
                ],
                "lesson": 1
            }
        ]
    }
}

// Модуль запускается в случае неудачной авторизации
function unsuccess_module(redirect = false) {
    if (redirect) {
        location.href = "https://softculture.cc";
    } else {
        location.reload();
    }
}

// Модуль запускается в случае удачной авторизации
function success_module(video_data, mail) {
    console.log('Login successful');
    // TO DO: добавить Fingerprinting и авторизация в Метрике
    load_player(video_data);
}

// Загрузка плеера и списка видеозаписей
function load_player(video_data) {
    // Загрузка плеера с первым видео
    //video_data = example_data;
    var first_video = video_data['result']['video'][0]['files'][0];
    var tech = video_data['result']['tech'];
    console.log(tech);
    var slug = video_data['result']['slug'];
    singlePlayer(first_video, slug, html5 = tech);

    // Создание списка всех видеозаписей
    createMedialist(video_data, slug, 'mediamenu', 'medialist');
}
