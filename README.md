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

- **Ana Sayfa**: bugün, geciken, yedi gün ve ay sayıları. Bugünün
  programı, gecikenler listesi ve yaklaşan kayıtlar.
- **Ajanda**: büyük ay ızgarası, her hücrede o günün kayıtları renkli
  etiketleriyle görünür.
- **Bildirimler**: gelen randevu talepleri. Onaylanan talep takvime kayıt
  olarak düşer, reddedilen düşmez. Okunmamış talep sayısı ikon üstünde
  rozet olarak görünür.
- **Almanak**: on iki ay tek ekranda, kayıtlı günler işaretli. Altında yıl
  özeti, etiket dağılımı ve sıradaki kayıtlar.
- **Gün paneli**: bir güne tıklayınca sağdan açılır. Kayıt ekleme,
  düzenleme, tamamlama ve silme burada yapılır.
- **Ayarlar**: müsaitlik bağlantısı, çalışma düzeni, yedek işlemleri ve
  çıkış. Rayın en altındaki dişli açar.

Rayın üstündeki logo ana sayfaya döner. Logo `components/Logo.tsx`
içinde vektör olarak durur, aynı çizim `app/icon.svg` ile sekme
ikonunda, `app/apple-icon.png` ile iOS kısayolunda ve `public/logo.svg`
ile paylaşımlarda kullanılır.

## Müsaitlik ve randevu

`/musaitlik` sayfası şifresizdir, paylaşılmak için vardır. Ziyaretçi o
aydaki boş gün ve saatleri görür, kayıtların içeriğini görmez.

Boş saat hesabı şöyle çalışır: çalışma günleri ve saatleri ayarlardan
gelir, aralık randevu süresine bölünür, üstüne denk gelen kayıtlar ve
bekleyen randevular düşülür. Bir kaydın kapattığı süre, kayıt formundaki
süre alanıdır.

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
| Etiket | Genel, İş, Kişisel, Görüşme, Ödeme, Önemli, Kutlama |
| Not | Boş bırakılabilir, en fazla 2000 karakter |

Aylık tekrarda ayın 31'i gibi günler kısa aylarda ayın son gününe kayar.
Yıllık tekrarda 29 Şubat, artık olmayan yıllarda 28 Şubat'ta görünür.

## Klavye kısayolları

| Tuş | İş |
| --- | --- |
| p | Ana Sayfa |
| a | Ajanda |
| y | Almanak |
| t | Bugüne döner |
| n | Yeni kayıt |
| Ok tuşları | Ajandada gün seçimini gezdirir |
| Enter | Seçili günü açar |
| / | Aramaya odaklanır |
| Esc | Açık paneli veya aramayı kapatır |

## Veri ve yedek

- Kayıtlar `data/events.json` içinde tutulur ve `.gitignore` ile repo
  dışında bırakılır, kişisel veri GitHub'a gitmez.
- `data/events.sample.json` repoda durur, ilk kurulumda örnek içerik verir.
- Ayarlardaki **Yedek al** tüm kayıtları JSON indirir.
- **Yedek yükle** seçilen JSON ile mevcut kayıtların yerine geçer,
  geçersiz satırlar atlanır.

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
