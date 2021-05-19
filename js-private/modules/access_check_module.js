const dialogMessages = {
  accessError: '<p>Упс! Либо вы ввели неверный пароль, либо \
                у вас закончился доступ к видеозаписям.<br/></br/>\
                Чтобы попробовать еще раз, нажмите «ОК».<br/><br/>\
                Для возобновления доступа к видеозаписям \
                пишите нам на почту: \
                <a href="mailto:hello@softculture.cc">hello@softculture.cc</a></p>',
  urlError:     '<p>Упс! Вы ошиблись в адресе страницы или доступ \
                к этой странице был закрыт.<br/><br/>\
                Для возобновления доступа пишите нам на почту: \
                <a href="mailto:hello@softculture.cc">hello@softculture.cc</a></p>',
};

const getEmail = () => localStorage.getItem('email');
const setEmail = (email) => localStorage.setItem('email', email);
const removeEmail = () => localStorage.removeItem('email');

const extractSlug = () => {
  const pageUrl = window.location.href;
  return pageUrl.substr(pageUrl.lastIndexOf('/') + 1);
};

// Вызывает prompt для ввода «пароля»
const inputPassword = () => {
  vex.dialog.prompt({
    message: ' ',
    placeholder: 'Введите пароль',
    // В callback передается false при нажатии CANCEL
    // и введеное значение при нажатии OK
    callback: (value) => {
      if (value === false) unsuccess_module(true);
      else {
        const email = value.trim().toLowerCase();
        checkAccessByMail(email);
      }
    },
  });
};

// Настройка и отправка запроса к api
const checkAccessByMail = (email) => {
  //const slug = extractSlug();
  //const slug = window.location.search.substr(window.location.search.lastIndexOf("=") + 1);
  const slug = "tst10101";
  let xhr = new XMLHttpRequest();
  const url = `https://api.softculture.cc/v1/video-authentication?email=${email}&slug=${slug}`;
  xhr.open('GET', url, true);

  xhr.onload = () => {
    const params = {
      status: xhr.status,
      response: JSON.parse(xhr.response),
      email,
    };
    videoAuthResponseHandler(params);
  };

  xhr.send();
};

// Обработчик ответа на запрос
const videoAuthResponseHandler = (obj) => {
  switch(obj.status) {
    case 403:
      videoAuthAccessError();
      break;
    case 400:
      error_module(obj.response);
      break;
    case 404:
      videoAuthUrlError();
      break;
    case 204:
      error_module('deprecated');
      break;
    case 200:
      setEmail(obj.email);
      success_module(obj.response, obj.email);
      break;
    default:
      error_module(obj.response);
      break;
  };
};

// Вызывает confirm при 403 ошибке
const videoAuthAccessError = () => {
  removeEmail();
  vex.dialog.confirm({
    unsafeMessage: dialogMessages.accessError,
    callback: (ok) => {
      if (ok) access_check_module();
      else unsuccess_module(true);
    },
  });
};

// Вызывает alert при 404 ошибке
const videoAuthUrlError = () => {
  vex.dialog.alert({
    unsafeMessage: dialogMessages.urlError,
    callback: () => unsuccess_module(true),
  });
};

const access_check_module = () => {
  let email = getEmail();
  if (email == null) inputPassword();
  else checkAccessByMail(email);
};
