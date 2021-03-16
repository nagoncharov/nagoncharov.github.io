// Обычное оповещение
function show_alert(message, unsuccess_func) {
  vex.dialog.confirm({
      unsafeMessage: message,
      callback: function (value) {
          unsuccess_func();
      }
  })
}

function show_question(message, unsuccess_func) {
  return promise = new Promise(function(resolve, reject) {
    vex.dialog.confirm({
        unsafeMessage: message,
        callback: function (value) {
            if (value) {
              resolve(value);
            } else {
              unsuccess_func();
            }
        }
    })
  });
}

function password_promt(placeholder) {
  return promise = new Promise(function(resolve, reject) {
    vex.dialog.prompt({
      message: 'Введите пароль',
      placeholder: placeholder,
      callback: function(value) {
        if (value) {
          resolve(value);
        } else {
          reject(new Error("no email provided"));
        }
      }
    })
  });
}

function pincode_check(unsuccess_func){
  return promise = new Promise(function(resolve, reject) {
    vex.dialog.confirm({
        unsafeMessage: "",
        callback: function (value) {
          if (value) {
            if (localStorage.getItem("sc_archive_authorized") === "0x44fb71") {
              resolve(value);
            }else{
              unsuccess_func();
            }
          } else {
              unsuccess_func();
          }
        }
      });
      pincheck_call();
    });
}

// Функция запроса входа с проверкой на стороне клиента
// Браузер должен поддерживать Session Storage
// В случае успешного входа сохраняет в Session Storage:
// login: 1
// pass: успешный пароль
function password_check(passwords_array, placeholder, message, success_func, unsuccess_func) {
    if (sessionStorage.login != 1) {
      // Запрос пароля
      vex.dialog.prompt({
          message: 'Введите пароль',
          placeholder: placeholder,
          callback: function (value) {
              // Обработка введенного значения
              if (passwords_array.includes(value)) {
                  // Успешный вход */
                  sessionStorage.login = 1;
                  sessionStorage.pass = value;
                  // Перенаправление на else statement
                  password_check(passwords_array, placeholder, message, success_func, unsuccess_func);
              } else {
                  // Предложение повторить
                  vex.dialog.confirm({
                      message: message,
                      callback: function (value) {
                          if (value) {
                            password_check(passwords_array, placeholder, message, success_func, unsuccess_func);
                          } else {
                            unsuccess_func();
                          }
                      }
                  })
              }
          }
      })
    } else {
        // Вход произведен
        console.log('successful login');
        success_func();
    }
}
