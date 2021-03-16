const error_module = (msg) => {
  vex.dialog.alert({
    unsafeMessage: '<p>Что-то сломалось, непонятно почему.<br/>\
                    Напишите нам на почту:<br/>\
                    <a href="mailto:hello@softculture.cc">hello@softculture.cc</a></p>'
                    + '<p style="font-family: monospace; font-size: 14px; line-height: 1.2;">' + msg['error'] + '</p>',
    // callback вызывается при нажатии OK
    callback: () => {
      unsuccess_module(true);
    },
  });
};
