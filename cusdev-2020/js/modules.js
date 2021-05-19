// Messages
const example_data = {
    "result": {
        "tech": true,
        "video": [{
                "files": [{
                        "path": "online/RVT/RVT_19.20.03_L1-1_Interface.mp4",
                        "selfmade": true,
                        "title": "1-1. Interface"
                    },
                    {
                        "path": "CBL/CBL_8.17.09_L1_Landscape.mp4",
                        "selfmade": true,
                        "title": "1-2. Blank"
                    },
                    {
                        "path": "online/RVT/RVT_19.20.03_L1-3_Modify.mp4",
                        "selfmade": true,
                        "title": "1-3. Modify"
                    }
                ],
                "lesson": 1
            },
            {
                "files": [{
                        "path": "online/RVT/RVT_19.20.03_L2-1_Levels.mp4",
                        "selfmade": true,
                        "title": "2-5. Levels"
                    },
                    {
                        "path": "online/RVT/RVT_19.20.03_L2-2_Axis.mp4",
                        "selfmade": true,
                        "title": "2-6. Axis"
                    },
                    {
                        "path": "online/RVT/RVT_19.20.03_L2-3_Filters.mp4",
                        "selfmade": true,
                        "title": "2-7. Filters"
                    }
                ],
                "lesson": 2
            },
            {
                "files": [{
                        "path": "online/RVT/RVT_19.20.03_L4-1_Stair.mp4",
                        "selfmade": true,
                        "title": "3-13. 1 View Properties"
                    },
                    {
                        "path": "online/RVT/RVT_19.20.03_L3_2_Elevation_Section.mp4",
                        "selfmade": true,
                        "title": "3-14. 2 Elevation Section"
                    },
                    {
                        "path": "online/RVT/RVT_19.20.03_L3_3_Floor.mp4",
                        "selfmade": true,
                        "title": "3-15. 3 Floor"
                    }
                ],
                "lesson": 3
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
    console.log(video_data);
    var first_video = video_data['result']['video'][0]['files'][0];
    var tech = video_data['result']['tech'];
    console.log(tech);
    var slug = video_data['result']['slug'];
    singlePlayer(first_video, slug, html5 = tech);

    // Создание списка всех видеозаписей
    createMedialist(video_data, slug, 'mediamenu', 'medialist');
}
