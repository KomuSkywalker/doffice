# Almanak

Takvim, ajanda ve kayıt yönetimini tek ekranda toplayan kişisel ofis
paneli. Sol menüden panel, takvim, yıl ve kayıt defteri arasında geçilir.

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

## Görünümler

Sol kenarda ince bir ikon rayı var. İkonun üzerine gelince adı yazar, en
altta ayarlar durur.

- **Ana Sayfa**: bugün, geciken, yedi gün ve ay sayıları. Bugünün
  programı, gecikenler listesi ve yaklaşan kayıtlar.
- **Ajanda**: büyük ay ızgarası, her hücrede o günün kayıtları renkli
  etiketleriyle görünür.
- **Almanak**: on iki ay tek ekranda, kayıtlı günler işaretli. Altında yıl
  özeti, etiket dağılımı ve sıradaki kayıtlar.
- **Gün paneli**: bir güne tıklayınca sağdan açılır. Kayıt ekleme,
  düzenleme, tamamlama ve silme burada yapılır.
- **Ayarlar**: yedek alma, yedek yükleme ve yazma kilidi. Rayın en
  altındaki dişli açar.

Rayın üstündeki kesik çizgili kare logo yeri. Logo 48x48 piksellik kare
alana oturur, dosya gelince oraya yerleşir.

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
| `ALMANAK_KEY` | boş | Doluysa ekleme, düzenleme, silme ve yedek yükleme için anahtar istenir. Boşsa yazma serbesttir, yerel kullanım içindir. |
| `ALMANAK_DATA_FILE` | `events.json` | `data/` klasörü içindeki veri dosyasının adı. |

Anahtar tarayıcıda yalnızca sekme oturumu boyunca saklanır.

## Güvenlik

- Tüm API girdileri sunucuda doğrulanır, bilinmeyen etiket ve bozuk
  tarih reddedilir.
- Yazma uçlarında dakikada 120 istek sınırı vardır.
- `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`
  ve CSP başlıkları `next.config.ts` içinde tanımlıdır.
- Site `noindex` işaretlidir ve `robots.txt` tüm taramayı kapatır, kişisel
  bir araç olduğu için arama motorlarına açılmaz.
- Üretim bağımlılıklarında bilinen açık yok. `npm audit` çıktısındaki beş
  yüksek bulgu yalnızca `eslint-config-next` zincirindedir, geliştirme
  bağımlılığıdır ve kırıcı sürüm değişikliği olmadan kapanmıyor.

## Yayın notu

Vercel gibi sunucusuz ortamlarda dosya sistemi kalıcı değildir, oraya
çıkarsa veri her dağıtımda sıfırlanır. Kalıcı yayın için ya kendi
sunucunda `npm start` ile çalıştır ya da `lib/store.ts` içindeki okuma ve
yazma fonksiyonlarını Vercel KV, Supabase gibi bir depoya bağla. Dosya
arayüzü tek yerde toplandığı için değişiklik `lib/store.ts` ile sınırlıdır.

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
