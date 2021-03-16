var pin_tries = 3;
var script_source = "https://softculture.github.io/talentlms/";
/* Fetch timeout handler */
function timeout_global(ms, promise)
{
  return new Promise((resolve, reject) =>
  {
    setTimeout(() =>
    {
      reject(new Error("timeout"));
    }, ms);
    promise.then(resolve, reject);
  });
}

/*Unblock final button when passed course*/
function button_refresh(button)
{
	let butnGranparent = button.parent().parent();
	if (butnGranparent !== null)
	{
		$('#' + butnGranparent[0].id).load(document.URL + ' #' + butnGranparent[0].id);
	}
}

function startTimer(duration, display) { // Закидывает timer на элемент. Украл со stackoverflow
    if (typeof window.interval !== 'undefined') {
        clearInterval(window.interval);
    }
    var timer = duration,
        minutes, seconds;
    window.interval = setInterval(function() {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = "Повторить через " + minutes + ":" + seconds;

        if (--timer < 0) {
            timer = duration;
        }
    }, 1000);
}

function block_sending(seconds_til_unblock) { // Блокиратор отправки сообщения (таймер)
    $('#auth_send').prop('disabled', true);
    $('.auth_confirm').prop('disabled', false);
    startTimer(seconds_til_unblock, document.querySelector('#auth_send'));
    setTimeout(function() {
				pin_tries = 3;
        $('#auth_send').prop('disabled', false);
        $('#auth_send').html('Выслать PIN');
        $('.auth_confirm').prop('disabled', true);
        clearInterval(window.interval);
    }, (seconds_til_unblock + 1) * 1000);
}

function send_pin() { // Отправка сообщения
    let counter = 300;
		$('#auth_send').prop('disabled', true);
    return timeout_global(10000, fetch('https://api.softculture.cc/v1/messente-confirm-phone?email=' + sessionStorage['email']))
        .then((response) => {
						sessionStorage['last_sent'] = Date.now(); // Ориентир на значение таймера после рефреша страницы
				    block_sending(counter);
            $(".dialog").prop("hidden", true);
            $("#dialog_success").prop("hidden", false);
            return response.json();
        })
        .then((data) => {
          console.log(data);
            if(data['seconds_passed'] !== 0){
              counter = 300 - parseInt(data['seconds_passed']);
              sessionStorage['last_sent'] = Date.now() - counter * 1000;
              block_sending(counter);
              $(".dialog").prop("hidden", true);
              $("#dialog_cooldown").prop("hidden", false);
              sub_data = " " + data['seconds_passed'] + " секунд"
              $("#dialog_cooldown").append(sub_data)
            }
						if (data['error']){
							console.error(data['error']);
	            $(".dialog").prop("hidden", true);
	            $("#dialog_error").prop("hidden", false);
							$("#dialog_error").append(data['error']);
							$(".auth_send").prop("disabled", true);
              $(".auth_confirm").prop("disabled", true);
	            return false;
						}
						console.log(data);
        })
        .catch((error) => {
            console.error(error);
            $(".dialog").prop("hidden", true);
						$("#dialog_error").prop("hidden", false);
						$("#dialog_error").append(error);
						$(".auth_confirm").prop("disabled", true);
            return false;
        });
}

function resolve_unit() { // Автозавершение юнита. Когда юзер только подтвердил номер, или когда он зашёл с сохранившимся в сессии фактом подтверждения
		$(".dialog").prop("hidden", true);
		$("#dialog_done").prop("hidden", false);
    $('#auth_send').remove();
    $('.auth_confirm').remove();
    $(".vex-dialog-button-primary.vex-dialog-button.vex-first").prop("hidden", false);
    localStorage['sc_archive_authorized'] = "0x44fb71";
}

function check_pin() { // Проверяет пинкод через ещё один наш метод
    let entered_pin = $('#auth_confirm_input').prop('value');
    return timeout_global(10000, fetch('https://api.softculture.cc/v1/messente-check-pin?email=' + sessionStorage['email'] + '&pin=' + entered_pin))
        .then((response) => {
            console.log('Confirm send true');
            return response.json();
        })
        .then((data) => {
						if (data['error']){
							console.error(data['error']);
							$(".dialog").prop("hidden", true);
							$("#dialog_error").prop("hidden", false);
							$("#dialog_error").append(data['error']);
							return false;
						}
            if (data['result'] == true) {
                resolve_unit();
            } else {
							if (pin_tries > 1){
								pin_tries -= 1;
								$(".dialog").prop("hidden", true);
								$("#dialog_retry").prop("hidden", false);
								$("#dialog_retry").html("Введен неверный код подтверждения. Осталось попыток: " + pin_tries);
							}else{
								$(".dialog").prop("hidden", true);
								$("#dialog_wrong_pin").prop("hidden", false);
								$(".auth_confirm").prop("disabled", true);
							}
						}
        })
        .catch((error) => {
						console.error(error);
						$(".dialog").prop("hidden", true);
						$("#dialog_error").prop("hidden", false);
						$("#dialog_error").append(error);
						$(".auth_confirm").prop("disabled", true);
						return false;
        });
}

function refresh_block() { // Подсчитывает, время, на которое надо рефрешнуть таймер пинкода
    let seconds_til_unblock = 300 - (Date.now() - sessionStorage['last_sent']) / 1000; // Эта переменная может получить NaN но это не рушит код
    if (seconds_til_unblock > 0) {
        block_sending(seconds_til_unblock);
    }
}

function pincheck_call(){
  $(document).ready(function (){
    let vex_form = $(".vex-dialog-form"); // Div, на который цепляемся
    if (vex_form.length !== 0){
      // Здесь вешаются все кнопки, инпуты и нужные онклики:
      vex_form.prepend("<div id='auth_unit'></div>");
      $(".vex-dialog-button-primary.vex-dialog-button.vex-first").prop("hidden", true);
      auth_unit = $("#auth_unit");
      auth_unit.load(script_source +'pincheck_snippet_archive');
      let complete_button = $('vex-dialog-button-primary vex-dialog-button vex-first'); // Кнопка завершения юнита
      setTimeout(
        function() {
          refresh_block();
        }, 500);
    }});
}
