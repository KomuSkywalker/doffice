# Doffice

Takvim, ajanda ve kayıt yönetimini tek ekranda toplayan kişisel ofis
paneli. Sol kenardaki ikon rayından bölümler arasında geçilir.

Tasarım neo brutalist: siyah çerçeveler, sert gölgeler, keskin köşeler ve
her yerde Helvetica. Palet kartvizitten alındı: krem zemin, altın sarısı,
nane yeşili, lila, gök mavisi ve mercan. Veri tek bir JSON dosyasında
durur, dış servis yoktur.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini aç. İlk açılışta
`data/events.json` yoksa `data/events.sample.json` içindeki örnek
kayıtlarla oluşturulur.

Üretim derlemesi:

```bash
npm run build
npm start
```

## Giriş

Panel şifreyle korunur. Şifre `DOFFICE_PASSWORD` ortam değişkeninden gelir,
kodda yazmaz. Doğru şifre girilince imzalı bir oturum çerezi kurulur ve
otuz gün geçerli olur. Çıkış, ayarlar penceresindeki düğmeyle yapılır.

Üretimde şifre tanımlı değilse panel açılmaz, kurulum uyarısı gösterilir.

## Görünümler

Sol kenarda ince bir ikon rayı var. İkonun üzerine gelince adı yazar, en
altta ayarlar durur.

- **Ana Sayfa**: bugün, geciken, yedi gün ve ay sayıları. Ajanda tarafında
  yalnızca bugünün programı durur. Yanında Gündem (açık projeler) ve Hızlı
  erişim (sık kullanılan siteler) panelleri vardır.
- **Ajanda**: büyük ay ızgarası, her hücrede o günün kayıtları renkli
  etiketleriyle görünür.
- **Projeler**: dosyalar ve projeler. Her projenin adı, durumu (aktif,
  beklemede, bitti), rengi, notu, aşama listesi ve bağlantıları olur.
- **Bildirimler**: gelen randevu talepleri. Onaylanan talep takvime kayıt
  olarak düşer, reddedilen düşmez. Okunmamış talep sayısı ikon üstünde
  rozet olarak görünür.
- **Almanak**: on iki ay tek ekranda, kayıtlı günler işaretli. Altında yıl
  özeti, etiket dağılımı ve sıradaki kayıtlar.
- **Gün paneli**: bir güne tıklayınca sağdan açılır. Kayıt ekleme,
  düzenleme, tamamlama ve silme burada yapılır.
- **Ayarlar**: üç sekme. Bağlantılar (müsaitlik bağlantısı üretme),
  Rutinler (haftalık sabit bloklar), Sistem (yedek ve çıkış). Rayın en
  altındaki dişli açar.

Rayın üstündeki logo ana sayfaya döner. Logo `components/Logo.tsx`
içinde vektör olarak durur, aynı çizim `app/icon.svg` ile sekme
ikonunda, `app/apple-icon.png` ile iOS kısayolunda ve `public/logo.svg`
ile paylaşımlarda kullanılır.

## Günlük rutinler

Her hafta tekrar eden sabit işler (ders, antrenman, sabit toplantı)
Ayarlar penceresindeki **Günlük rutinler** bölümünde tanımlanır. Rutine
ad verilir, günler seçilir (tek tek ya da Her gün, Hafta içi, Hafta sonu
kısayollarıyla), başlangıç ve bitiş saati girilir. İstersen etiket adı,
renk, not ve bir tarih aralığı da verebilirsin, böylece rutin yalnızca o
dönemde işler.

Rutin kayıt değildir, kopyası çıkarılmaz. Seçili günlerde Ajanda
hücresinde ve gün panelinde görünür, müsaitlik bağlantısında o saatleri
kapatır. Gün panelinde düzenlenemez, yönetimi Ayarlar bölümündedir.
**Durdur** rutini silmeden askıya alır, **Başlat** geri açar.

Almanak (yıl) görünümünde rutinler işaretlenmez, çünkü günlük bir rutin
yılın bütün günlerini doldurup işareti anlamsız kılardı.

## Projeler ve kısayollar

Projeler sekmesinde üzerinde çalıştığın dosyaları tutarsın. Bir projeye ad,
durum, renk, not, aşama listesi ve istediğin kadar bağlantı (Drive klasörü,
tapu kaydı, ilan sayfası) eklersin. Durumu `bitti` olmayan projeler Ana
Sayfa'daki **Gündem** panelinde listelenir, en son güncellenen üstte durur.

İlerleme aşamalardan çıkar. Proje kartındaki kutucuğu işaretleyince aşama
biter, ilerleme çubuğu ve `bitti/toplam` sayacı güncellenir. Bitmemiş ilk
aşama "Sırada" diye yazar, aynı bilgi Gündem panelinde de görünür.

Ana Sayfa'daki **Hızlı erişim** paneline sık kullandığın siteleri
eklersin. Adres `http` ile başlamıyorsa başına `https://` eklenir, başka
şema (`javascript:` gibi) kabul edilmez. Kısayollar yeni sekmede açılır.

## Arama

Üstteki arama kutusu tüm sistemde arar: kayıtlar, rutinler, projeler,
proje bağlantıları ve kısayollar. Sonuç satırında ne olduğu rozetle
yazar. Kayıt seçilince o gün açılır, proje seçilince Projeler sekmesine
geçilir, bağlantı ve kısayol yeni sekmede açılır.

## Müsaitlik ve randevu

Müsaitlik bağlantısını panelden sen oluşturursun. Ayarlar penceresindeki
Bağlantılar sekmesinde etiket (kime gönderildiği), geçerlilik süresi ve
o bağlantıya özel bir not girip bağlantı üretirsin, listeden kopyalar,
işin bitince kapatırsın. Kapatılan veya süresi dolan bağlantı bir daha
açılmaz. Kapalı bağlantılar listede yer kaplamaz, sayaçlı tuşun arkasında
durur.

Her bağlantının adresi `/musaitlik/<token>` biçimindedir ve token rastgele
üretilir. Tokensiz `/musaitlik` adresi hiçbir şey göstermez, yani adresi
tahmin eden biri takvimine bakamaz. Ziyaretçi o aydaki boş gün ve
saatleri görür, kayıtların içeriğini görmez.

Boş saat hesabının ayarı yoktur, doğrudan takvimden çıkar. Gün penceresi
her gün için `09:00` ile `20:00` arası, dilim bir saattir
(`lib/availability.ts` içindeki `OPEN_DAY`). Bu pencereden kayıtların,
rutinlerin ve bekleyen randevuların kapattığı saatler düşülür. Bir kaydın
kapattığı süre, kayıt formundaki süre alanıdır, rutinde ise başlangıç ile
bitiş arasıdır. Kapalı kalmasını istediğin saatler için rutin tanımla,
mesela hafta sonunu ya da akşam saatlerini kapatan bir rutin.

Dolu saatler ziyaretçiye gizlenmez, üstü çizili ve seçilemez biçimde
görünür. Böylece karşı taraf o günün hangi saatinin boş hangisinin dolu
olduğunu görür. Dolu saatin başlığı veya içeriği gösterilmez.

Ziyaretçi saat seçip ad ve iletişim bırakınca talep düşer. Talep anında
bildirime gelir, panelden onaylanır veya reddedilir. Form gizli alan
(honeypot) ve saatte sekiz istek sınırıyla korunur, seçilen saat sunucuda
yeniden doğrulanır.

## Kayıt alanları

| Alan | Açıklama |
| --- | --- |
| Başlık | Zorunlu, en fazla 160 karakter |
| Saat | Boş bırakılabilir, SS:DD |
| Tarih | Düzenlerken değiştirilir, kayıt başka güne taşınır |
| Tekrar | Tekrar yok, her hafta, her ay, her yıl |
| Etiket | Serbest metin, en fazla 24 karakter, boş bırakılabilir |
| Renk | Yedi hazır renk ya da renk seçiciyle istediğin ton |
| Not | Boş bırakılabilir, en fazla 2000 karakter |

Aylık tekrarda ayın 31'i gibi günler kısa aylarda ayın son gününe kayar.
Yıllık tekrarda 29 Şubat, artık olmayan yıllarda 28 Şubat'ta görünür.

## Klavye kısayolları

| Tuş | İş |
| --- | --- |
| p | Ana Sayfa |
| a | Ajanda |
| y | Almanak |
| r | Projeler |
| t | Bugüne döner |
| n | Yeni kayıt |
| Ok tuşları | Ajandada gün seçimini gezdirir |
| Enter | Seçili günü açar |
| / | Aramaya odaklanır |
| Esc | Açık paneli veya aramayı kapatır |

## Veri ve yedek

- Kayıtlar, rutinler, projeler ve kısayollar `data/events.json` içinde tutulur ve `.gitignore` ile repo
  dışında bırakılır, kişisel veri GitHub'a gitmez.
- `data/events.sample.json` repoda durur, ilk kurulumda örnek içerik verir.
- Ayarlardaki **Yedek al** kayıtları ve rutinleri JSON indirir.
- **Yedek yükle** seçilen JSON ile mevcut kayıtların yerine geçer,
  geçersiz satırlar atlanır. Dosyada rutin varsa onlar da geri yüklenir.

## Ortam değişkenleri

`.env.example` dosyasını `.env.local` olarak kopyala.

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `DOFFICE_PASSWORD` | boş | Panele giriş şifresi. Üretimde zorunludur, boşsa panel kapanır. Yerelde boş bırakılırsa giriş sorulmaz. |
| `DOFFICE_SECRET` | şifreden türetilir | Oturum çerezini imzalayan gizli değer. Tanımlanırsa şifre değişse de oturumlar ayrı kalır. |
| `DOFFICE_DATA_FILE` | `events.json` | `data/` klasörü içindeki veri dosyasının adı. |
| `TZ` | sistem saati | Sunucu saat dilimi. Vercel'de `Europe/Istanbul` verilmelidir, yoksa boş saatler UTC'ye göre hesaplanır. |

Oturum çerezi HttpOnly ve SameSite korumalıdır, üretimde yalnızca
HTTPS üzerinden gider.

## Güvenlik

- Tüm API girdileri sunucuda doğrulanır, bilinmeyen etiket ve bozuk
  tarih reddedilir.
- Panel uçları oturum çerezi ister, randevu ucu dışarıya açıktır.
- İstek sınırı kovalara ayrılmıştır: genel dakikada 120, giriş on
  dakikada 12, randevu saatte 8.
- `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`
  ve CSP başlıkları `next.config.ts` içinde tanımlıdır.
- Site `noindex` işaretlidir ve `robots.txt` tüm taramayı kapatır, kişisel
  bir araç olduğu için arama motorlarına açılmaz.
- Üretim bağımlılıklarında bilinen açık yok. `npm audit` çıktısındaki beş
  yüksek bulgu yalnızca `eslint-config-next` zincirindedir, geliştirme
  bağımlılığıdır ve kırıcı sürüm değişikliği olmadan kapanmıyor.

## Yayın

Canlı adres: https://doffice-navy.vercel.app

Depo GitHub'a bağlıdır, `main` dalına her gönderim otomatik dağıtılır.

Depolama iki sürücülüdür ve ortama göre kendisi seçer.

- **Yerel çalışmada** kayıtlar `data/events.json` dosyasına yazılır.
- **Vercel gibi sunucusuz ortamda** dosya sistemi salt okunur olduğu için
  Vercel Blob kullanılır. Projeye bir Blob deposu bağlandığında
  `BLOB_READ_WRITE_TOKEN` otomatik gelir ve kayıtlar `doffice/events.json`
  adıyla özel (private) blob olarak saklanır, herkese açık bir adresi
  olmaz.

Blob bağlı değilse site açılır ve örnek kayıtları gösterir, ancak yazma
denemeleri "kalıcı depolama bağlı değil" hatası döner.

Panel şifreyle kapalıdır, yalnızca `/musaitlik` sayfası ve randevu ucu
dışarıya açıktır.

## Mock içerik

`data/events.sample.json` içindeki 14 kayıt gerçek değildir, örnek
içeriktir. Kendi kayıtlarını girmeye başlamadan önce silebilirsin:

```bash
rm data/events.json
```

Dosyayı silip sayfayı yenilersen örnekler tekrar yüklenir. Tamamen boş
başlamak için `data/events.json` dosyasına `[]` yaz.

## Teknik

Next.js 16 App Router, React 19, TypeScript, Tailwind v4. Takvim mantığı
`lib/dates.ts` ve `lib/occurrences.ts` içinde saf fonksiyonlardır, dış
tarih kütüphanesi kullanılmaz. Yazı tipi sistemdeki Helvetica'dır, web
fontu indirilmez. Renk, köşe ve gölge token'ları `app/globals.css`
içindeki `@theme` bloğunda tanımlıdır, metin kontrastları WCAG AA eşiğine
göre seçilmiştir. Tüm renkler tek yerden gelir, bileşenlerde sabit renk
kodu yoktur.
