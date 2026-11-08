# hiç kimse (hickimse.com) — yeniden tasarım notları

Site statik (Netlify tarzı): sadece HTML/CSS/JS, derleme adımı yok. `out` klasörünün içeriğini olduğu gibi yayınlayabilirsin.

## Yapı
- `/` ana sayfa, `/outis/` Outis, `/nostraticnumbers/` Nostratik sayılar, `/privacy/` gizlilik, `404.html`
- Temiz adresler (`/outis/`, `/nostraticnumbers/`); eski `.html` adresleri `_redirects` ile yönleniyor.
- Tüm yazı tipleri, betikler ve görseller `assets/` altında; hiçbir CDN / üçüncü taraf isteği yok. CSP (`_headers`) bu yüzden sıkı tutulabildi.

## Tasarım
- btylmz'den alınanlar: açık/koyu tema, ince ambient katmanı (orb, nokta ızgarası, ağ çizgileri, imleç ışığı), dönen başlık kelimesi, yazı-makinesi satırı, sayaçlar, sayfa geçiş animasyonu.
- Akademik ton: Source Serif 4 gövde, Plus Jakarta Sans arayüz, IPA için Noto Serif IPA, Eski Türkçe (Orhun) için Noto Sans Old Turkic. Kaynak/atıf bölümleri, breadcrumb, figür sayıları.
- Hareket azaltma tercihine ve düşük performanslı cihazlara (lite mod) saygı gösterir.

## Nostratik sayfası
- Markmap/CDN bağımlılığı kaldırıldı. Her sayı için: SVG ağaç, tablo görünümü, ve sayfa başında 8 sayıyı karşılaştıran matris.
- Tablo her zaman kaynak veridir; JavaScript kapalıyken tablolar görünür.
- 8 dil ailesi için renk körlüğüne dayanıklı, doğrulanmış palet (renge ek olarak etiket + tablo var).
- Klavye ve ekran okuyucu erişilebilirliği: axe taramasında hata yok.

## Düzeltilen hatalar
- Dil adı yazımları: Toharian→Tocharian, Gokturk→Old Turkic, İdil Bulgar→Volga Bulgar, Hanty→Khanty, Mongol→Mongolian.
- 1. sayıda `*išt- Proto Semitic?` satırı dil sütununa karışmıştı; dil ve biçim ayrıldı.
- Outis görseli 6,3 MB idi → ~200 KB (800 px webp) / ~700 KB (1400 px) srcset.
- İletişim e-postası tek yerde, tutarlı.
- Eksik meta etiketleri, OG/Twitter kartı, manifest, ikonlar, robots.txt, sitemap.xml, 404 sayfası, güvenlik başlıkları, "içeriğe geç" bağlantısı, yazdırma stili eklendi.

## İkinci tur (senin geri bildirimin)
- **Analytics:** GTM-PB6CHT89, `assets/js/analytics.js` içinde. Çerez bandı yok; varsayılan açık. Altbilgideki "Privacy settings" ile ziyaretçi kapatabilir (`/privacy/` sayfasında da düğme var). Tarayıcı GPC/Do Not Track gönderiyorsa kapalı başlar. Verdiğin kodun `gtag` kısmını aynen kullandım, üstüne GTM'in standart `gtm.start` olayını ekledim (olmazsa "All Pages" tetikleyicileri çalışmayabilir). CSP, GTM ve GA alan adlarına izin verecek şekilde güncellendi (`_headers`).
- İletişim penceresi artık ekranın ortasında (sorun `margin:0` sıfırlamasıydı).
- Marka adı her yerde "hiç kimse" (başlıklar, logo yanı, OG görseli, manifest, alt bilgi, atıf). Alan adı ve URL'ler `hickimse.com` olarak kaldı.
- Varsayılan tema açık; sistem koyu olsa bile açık açılır. Koyu tema yalnızca ziyaretçi seçerse.
- Breadcrumb: `hiç kimse / Nostratic Numbers`.
- Ana sayfa metinleri dilbilimden bağımsız (blog/deneme/teori); sayısal istatistik şeridi kaldırıldı.
- Nostratik 1–10: Berber artık Semitic ile aynı seviyede kendi dalı; Hititçe `Anatolian` dalında, `Indo-European` ayrı dal.
- Sol hızlı menüye "başa dön" düğmesi eklendi (mobilde de çalışır).
- Görsel eklemeler: üst çizgide okuma ilerlemesi, imleçle düğümlerin bağlanması, boş yere tıklayınca halka dalgası, kartta dönen kenar ışığı, ince doku, ana sayfada aşağı kaydırma oku.
- Küçük erişilebilirlik düzeltmesi (ağaçtaki form etiketleri).

## Karar vermen gereken noktalar
0. **Gizlilik sayfası taslaktır.** "Veriler en fazla 14 ay saklanır" ve "reklam özellikleri kullanılmaz" cümleleri GA4 mülkündeki veri saklama ayarına ve GTM kapsayıcındaki etiketlere bağlı; ikisini de kontrol et ya da metni ona göre düzelt. Hukuki metin değildir.
1. **E-posta:** şu an `adaptivesubject@gmail.com`. İstersen `iletisim@hickimse.com` gibi bir adresle değiştir (tek yerde: iletişim penceresi + sayfa altlığı).
2. **Veri tutarsızlıkları** (kaynağını sen bilirsin):
   - 1. sayıda `*?` biçimi `*hoikʷ` olarak yazılmıştı; öyle bıraktım.
   - 3. sayıda `*kweɽ` ve `*kwed` karışıktı; hepsini `*kwed` yaptım. Yanlışsa düzelt.
   - 2. sayıda Proto-Semitik `*išt-` 1. sayıdan kopyalanmış gibi duruyor; doğrulamanı öneririm.
3. **Outis görseli** için kaynak/künye eklenmeli (ressam, eser adı, lisans).
4. **Outis metnindeki Οὖτις / Odyssey 9 açıklaması** benim yazdığım yer tutucu metindir; kendi metninle değiştir.
5. Arayüz dili İngilizce bırakıldı (orijinal gibi). Türkçeleştirmek istersen söyle.
6. Kişisel adını bu siteye eklemedim; "Outis / kimse" anonimliği korundu.
