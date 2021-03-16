rem download yarn https://yarnpkg.com/lang/en/docs/install/#windows-stable
rem yarn global add javascript-obfuscator
xcopy js-private app\js
for %%i in (js-private\*) do (javascript-obfuscator js-private/%%~ni.js --output app/js/%%~ni.js --rename-globals --seed 100 --reserved-names '_call','_global')
pause
