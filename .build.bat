rmdir /q /s out
mkdir out
7z a -tzip -r out/AugmentedSteamLegacy.xpi * -x!.* -x!out
