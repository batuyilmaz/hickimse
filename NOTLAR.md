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

## Bu turdaki değişiklikler
- Sol rayda tablo simgesi (karşılaştırma tablosuna gider), iki sayfada da. Ray artık yumuşak bir kapsül; koyu temadaki kare zemin (düşük performans modundan kalan eski kural) giderildi.
- Zamirlere 3sg (he/she/it, *sa?), 3pl (they, *sa-k?) ve what (*ma?) eklendi; rayda var.
- 1 sayısı iki kök: *hoikʷ? (Afro-Asiatic, Indo-Anatolian, Uralic, Mongolic, Tyrsenian, Nakh) ve *mhad? (Ermenice, Turkic, Basque). Nenetsçe ŋop Moğolca düğümüne bağlı; başka aileye bağlanan yapraklar kesikli çizgi ve kendi ailesinin rengiyle gösteriliyor. Mongolic ve Nakh'ı sen belirtmediğin için *hoikʷ? altına koydum.
- Kökler: 4 *kwatw?, 6 *heth?, 10 *ted?. Kök düğümleri parıltılı bir kapsül içinde, dalların birleştiği noktada nabız atan halka var.
- Ses yolağı kutuları yalnızca türetmeyi gösteriyor: her satırda biçim ve o adımdaki ses değişimi (> ile). Düzenli yol önermediğim ailelerde "No regular path" yazıyor.
- Telefonda ağaç yukarıdan aşağı açılıyor (dikey, kıvrımlı dallar, aynı renkler, ? düğmeleri, katlama ve kopyalama).
- Arşivde küçük rekonstrüksiyon kutuları yerine simgeler: sayılar için tetraktys (1+2+3+4 = 10 taş, 8 ve 9 içi boş), zamirler için üç kesişen halka.
- Sayfa başı açıklamalarına kök ve yolakların varsayımsal ve geliştirilmeye açık olduğu eklendi.
- Kelime kontrolünde düzeltilenler: 2 Proto-Semitic *išt- → *θi.ˈnaːn; Nenetsçe 6 matq → matʲ, 7 sʲiqw → sʲiʔiw, 10 juq → juʔ; Kuzey Saamice 10 ˈlo.hi → ˈlo.ki; zamirlerde Toharca 1sg ɲiɕ, Moğolca 1sg pi, Hantıca 1pl/2pl mʉŋ/nʉŋ.

## Kontrol etmen gerekenler
1. Hititçe 1 (aːs), 5 (pan.ta), 6 (tuks) ve 10 (nat): bu sayılar Hititçede çoğunlukla logogramla yazılır; okumaların kaynağını kontrol et (1 için kaynaklarda šiya- geçer).
2. Ses yolakları benim önerdiğim çalışma hipotezleri; yeni kökler (*kwatw, *heth, *ted, *mhad) için baştan yazdım.
3. Yeni zamir kökleri (*sa, *sa-k, *ma) benim seçimim; Proto Uralic 3pl ve Proto Basque 3pl boş bıraktım.
4. Önceki açık noktalar: e-posta adresi, gizlilik metnindeki "14 ay / reklam yok" cümleleri.

## Düzenleme
Veriyi `hickimse-kaynak.zip` içindeki `nostratic_data.py` dosyasında değiştirip `python3 build_site.py` çalıştır. Kökler, yapraklar, aile dışı bağlantılar ('fam'), yolaklar ve 8/9 örnekleri hepsi o dosyada.
