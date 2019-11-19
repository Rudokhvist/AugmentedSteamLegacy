@echo off
rmdir /q /s out
mkdir out
rem copy content\AugmentedSteam\options.html content\options.html /b
"C:\Program Files\Git\bin\bash.exe" -c "patch --binary -b content/AugmentedSteam/options.html content/options.patch"
7z a -tzip -r out/AugmentedSteamLegacy.xpi * -x!.* -x!out -x!content\options.patch -x!content\AugmentedSteam\options.html.orig
del content\AugmentedSteam\options.html
rename content\AugmentedSteam\options.html.orig options.html