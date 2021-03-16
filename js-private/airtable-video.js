// Messages

broken_message = "<div>Что-то сломалось, непонятно почему. Напишите нам на почту: hello@softculture.cc</div>"

wrong_url_message = "<div>Упс! Вы ошиблись в адресе страницы или доступ к этой странице был закрыт.</div><br><div>Для возобновления доступа пишите нам на: hello@softculture.cc</div>"

wrong_pass_message = '<div>Упс! Либо вы ввели неверный пароль, либо у вас закончился доступ к видеозаписям.</div><br><div>Чтобы попробовать еще раз, нажмите «ОК».</div><br><div>Для возобновления доступа к видеозаписям пишите нам на почту: hello@softculture.cc</div>'

// Functions
function get_slug() {
  var pathname = window.location.pathname;
  if (document.location.host && window.location.hostname != 'nagoncharov.github.io') {
    // remote file over http or https
    console.log('prod')
    return pathname.substr(pathname.lastIndexOf("/") + 1);
  } else {
    // local file
    return test_slug;
  }
}

// Unsuccess function
function redirect() {
  console.log("app crashed");
  location.href = "https://softculture.cc";
}

// Success function
function pass_checked(data) {
  console.log(data);
  if (data['tech']) {
    // Non-flash player
    hide_class("flash-minimum");
  } else {
    // Flash player
    checkFlash();
  }
  singlePlayer(data['result']['video'][0]['files'][0], get_slug()); // Загрузка плеера с первым видео
  console.log(get_slug())
  createMedialist(data, get_slug(), 'mediamenu', 'medialist'); // Создание списка всех видеозаписей
}

// Hide class by name
function hide_class(name) {
  var li = document.getElementsByClassName(name);
  for (i = 0; i < li.length; i++) {
    li[i].style.display = 'none';
  }
}

// Check Flash on loading function
function checkFlash() {
  var flash = navigator.plugins.namedItem('Shockwave Flash');
  if(flash) {
    hide_class("flash-disabled");
  }
}

// Video request
function check_videos(email) {

  return new Promise(function(resolve, reject) {
    var slug = get_slug();
    var xhr = new XMLHttpRequest();
    email = email.trim()
    var url='https://api.softculture.cc/v1/video-authentication?email=' + email + '&slug=' + slug;
    //var url='http://127.0.0.1:5000/v1/video-access?email=' + email + '&slug=' + slug;
    xhr.open('GET', url, true);

    // 400, 404 — no need to retry, 403 — may be retied
    xhr.onload = function() {
      if(this.status==200) {
        resolve(JSON.parse(this.responseText));
      } else if(this.status==403) {
        resolve(JSON.parse(this.responseText));
      } else {
        var error = new Error(this.statusText);
        error.code = this.status;
        reject(error);
      }
    };

    xhr.onerror = function() {
      reject(new Error("Network Error"));
    };

    xhr.send();
  });
}

// Fingerprint Function
function get_device_fingerprint() {
  var platform = navigator.platform,
      parser = new UAParser(),
      result = parser.getResult(),
      //ua = navigator.userAgent,
      //system = ua.match(/\((.+?)\;(.+?)\;/ig),
      system = Object.values(result.os).join(" "),
      logicalProcessors = window.navigator.hardwareConcurrency,
      videocard,
      gl = document.createElement("canvas").getContext("webgl");
      if(gl !== null){
        ext = gl.getExtension("WEBGL_debug_renderer_info");
      }

  /* In Tor gl raises 'Error: WebGL warning: Unable to restrict WebGL limits to minimums.' */

  if(typeof ext !== 'undefined'){
      videocard = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    }

  var json = {"system": system, "platform": platform, "logicalProcessors" : logicalProcessors,
          "videocard": videocard, "width" : window.screen.width, "height": window.screen.height};

  // return JSON.stringify(json);
  return json
}

// Hash function
function hashCodeF(s) {
  key = Object.values(s).join("");
  return "D" + murmurhash3_32_gc(key, 256);
  // return "D" + s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);
  // return a&a},0);
}

// Device auth function
function auth_user(email) {
  var device_fingerprint_json = get_device_fingerprint();
  var device_fingerprint = hashCodeF(device_fingerprint_json);
  var device_fingerprint_str = JSON.stringify(device_fingerprint_json, null, " ").replace(/\"|{\s+|\n|}/g, "");
  // console.log(device_fingerprint);
  // console.log(device_fingerprint_str);
  var dfp = {};
  var dfp_str = {};
  dfp_str[device_fingerprint] = device_fingerprint_str;
  dfp[email] = dfp_str;
  // dfp[email] = device_fingerprint; // blind version without fingerprint text
  var goalParams = {"user":dfp};
  ym(52247398, 'reachGoal', 'login', goalParams);
  ym(52247398, 'userParams', { UserID: email });
}

// Main Function
async function checker() {
  try {
    if (sessionStorage.getItem("email") === null || sessionStorage.getItem("email") === "@") {
      var mail = await password_promt('myemail@email.com');
      mail = mail.toLowerCase();
      mail = mail.trim();
      sessionStorage.email = mail;
      console.log(mail);
    } else {
      var mail = sessionStorage.email;
    }
    try {
      let videos = await check_videos(mail);
      if ('error' in videos) {
        if (mail !== "@") {
          console.log(videos['error']);
          await show_question(wrong_pass_message, redirect);
        }
        sessionStorage.removeItem('email');
        checker();
      } else {
        console.log('Login successful');
        auth_user(mail);
        sessionStorage.email = mail;
        // if (localStorage.getItem("sc_archive_authorized") !== "0x44fb71") {
        //   await pincode_check(redirect);
        // }
        pass_checked(videos);
      }

    } catch(err) {
      console.log(err);
      if (err.code == 404) {
        show_alert(wrong_url_message, redirect);
      } else {
        show_alert(broken_message + `\n<p style='color:#DD0000';>${err}</p>`, function() { return undefined; });
      }
    }

  } catch(err) {
    console.log(err);
    redirect();
  }
}
