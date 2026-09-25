Ozon Bank payment page — smart app opening

This build keeps the existing payment page and adds device-aware opening:
- Android: attempts to open the installed Ozon Bank app (package ru.ozon.fintech.finance), with Ozon's official app link as fallback.
- iPhone/iPad: best-effort app open, then Ozon's official iOS link as fallback.
- Desktop/laptop: opens https://finance.ozon.ru/ in a new tab.

The card number is copied before the user proceeds, so it can be pasted into “Перевод по номеру карты”.

Upload the contents of this archive directly into the corresponding GitHub Pages folder, replacing the old files.
