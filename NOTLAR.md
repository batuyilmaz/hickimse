# hiç kimse (hickimse.com) — notlar

Site statik: bu klasörün içeriğini olduğu gibi yayınla (eski dosyaların hepsinin üzerine yaz). Kaynak üretici ayrı zipte (`hickimse-kaynak.zip`).

## Sayfalar
- `/` sade ana sayfa: içi boş "hiç kimse" yazısı (imleç yaklaşınca harfler mürekkeple dolar, arada bir dalga geçer), yazıların kısa dizini.
- `/archive/` arşiv artık ayrı sayfa.
- `/nostraticnumbers/` Nostratic v2.0: Numbers
- `/nostraticpronouns/` Nostratic v2.0: Pronouns (yeni)
- `/outis/`, `/privacy/`, `404.html`

## Nostratic v2.0 sayfaları
- Bütün temel rekonstrüksiyonlar `?` ile gösteriliyor (*hoikʷ?, *mi? ...).
- "Alternative reconstructions" kutuları ve her sayıdaki Tablo/Ağaç düğmesi kaldırıldı; yalnızca en üstteki karşılaştırma tablosu kaldı (en üst satırında Nostratik kökler var).
- Dil ailesi seçme çubuğu kaldırıldı.
- Her ağaç bir ekran: ortada, genişliğin yaklaşık 3/4'ü. Fare tekerleği / ok tuşu bir sonraki sayıya oturur (en az 860 px genişlik ve 620 px yükseklikte). Sol ray en solda sabit; başa dön ve sona git düğmeleri var. Mobilde ray üstte yatay, ağaç dikey liste.
- Her dil ailesinin yanında `?` düğmesi: o aile için olası ses yolağı (zincir + uyum: güçlü/olası/zayıf + tek cümle).
- 8 ve 9 için ayrı bölümler: ondan geriye sayma örnekleri (Fince, Kuzey Saamice, Mari, Mansi, Latince, Sanskrit, Eski Yunanca, Etrüskçe). Rayda 8 ve 9 var.
- Sayfa başında Babil kulesi simgesi: tek kökten sekiz renkli dil ışını.
- Sayfa sonunda diğer sayfaya geçiş kartı (Numbers ⇄ Pronouns) ve alıntı kutusu.

## Kontrol etmen gerekenler (bunları ben yazdım)
1. **Ses yolakları** (`?` kutuları) benim önerdiğim çalışma hipotezleri; yerleşik denklikler değil. Zayıf olanları açıkça "weak" işaretledim. Hepsini gözden geçir.
2. **Zamir verisi** baştan benim derlemem. Emin olmadıklarım: Fenike biçimleri, Berberice (Tamazight) biçimleri, Toharca (B) biçimleri, Ermenice (Klasik telaffuz kullandım), Nenetsçe ve Hantıca, Moğolca 1sg [pʲi]. Volga Bulgarcası zamirler için kaydedilmediğinden çıkarıldı; Etrüskçe yalnızca "mi" (I) için var. Berberice "who" boş.
3. **8/9 örnekleri:** Mansi biçimleri (ńololow, ontolow) yaklaşık yazım; Fince -deksa- "on" yorumu tartışmalı (metinde "often read as" dedim).
4. `?` düğmeleri yalnızca 8 ana aile dalında; alt dallarda (Semitic, Berber, Anatolian, Indo-European) yok. İstersen eklerim.
5. Önceki açık noktalar duruyor: 2. sayıda Proto-Semitic `*išt-` kopya gibi; 3. sayı `*kwed`; e-posta adresi; gizlilik metnindeki "14 ay / reklam yok" cümleleri.

## Düzenleme
Veriyi `hickimse-kaynak.zip` içindeki `nostratic_data.py` dosyasında değiştirip `python3 build_site.py` çalıştır; sayfalar `out/` klasörüne yeniden yazılır. Biçimler, yolaklar ve 8/9 örnekleri hepsi o dosyada.
