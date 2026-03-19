# CloudTicket Backend 🎫☁️

CloudTicket, AWS üzerinde Serverless mimari yaklaşımıyla geliştirilen, ölçeklenebilir ve güvenli bir etkinlik/bilet yönetim sistemi arka ucudur (backend). Bu proje, modern bulut geliştirme pratiklerini kullanarak yüksek erişilebilirlik, düşük gecikme süresi ve maliyet optimizasyonu sağlamayı hedefler.

## 🚀 Projenin Final Durumunda Sunacakları

Bu proje tamamlandığında, uçtan uca tamamen sunucusuz (serverless) tabanlı, olay güdümlü (event-driven) ve güvenli bir etkinlik yönetim platformunun altyapısını oluşturacaktır. Final sürümünde şu yetenekler tam olarak entegre edilmiş olacaktır:

- **Etkinlik Yönetimi:** Yeni etkinlikler oluşturma, mevcut etkinlikleri listeleme ve detaylarını görüntüleme yeteneği.
- **Güvenli Kimlik Doğrulama:** AWS Cognito entegrasyonu ile sadece yetkili (giriş yapmış) kullanıcıların etkinlik oluşturabilmesi ve dosya yükleme talebinde bulunabilmesi.
- **Medya Dosyası Yönetimi:** Etkinliklere ait görsellerin veya dosyaların AWS S3 üzerinden "Pre-signed URL" asenkron yükleme yöntemiyle, yükü doğrudan S3'e bırakarak güvenli bir şekilde depolanması.
- **Asenkron İşlem ve Kuyruk Yönetimi:** Amazon SQS aracılığıyla biletleme veya etkinlik işleme gibi yoğun iş yüklerinin kullanıcıyı bekletmeden arka planda (worker) güvenilir bir şekilde işlenmesi.
- **Olay Odaklı Mimari (Event-Driven):** Amazon EventBridge üzerinden sistem içi çeşitli mikro servis haberleşmelerinin veya durum değişikliklerinin (örn. "Yeni etkinlik oluşturuldu") diğer servislere aktarılabilmesi.
- **Gözlemlenebilirlik ve İzleme:** AWS X-Ray ile tüm API ve Lambda işlemlerinin performansının izlenmesi, darboğazların ve hataların tespit edilebilmesi.

## 🏗 Kullanılan Teknolojiler ve AWS Servisleri

Proje, gücünü tamamen Serverless Framework ve AWS servislerinden alır:

- **Compute:** AWS Lambda (Node.js 20.x, TypeScript & esbuild)
- **API Management:** Amazon API Gateway
- **Database:** Amazon DynamoDB (NoSQL veri depolama)
- **Message Queue:** Amazon SQS
- **Event Bus:** Amazon EventBridge
- **Storage:** Amazon S3
- **Authentication:** Amazon Cognito (User Pools)
- **Tracing:** AWS X-Ray
- **Infrastructure as Code (IaC):** Serverless Framework (v4)

## 📡 API Uç Noktaları (Endpoints)

| Metot | Uç Nokta (Path) | Açıklama | Yetkilendirme |
|-------|----------------|----------|---------------|
| `GET` | `/hello` | Sistemin ayakta olup olmadığını test etmek için basit bir endpoint. | Açık |
| `POST`| `/event` | Yeni bir etkinlik oluşturmak için kullanılır. SQS'e mesaj ve EventBridge'e olay gönderimi yapabilir. | **Cognito** |
| `GET` | `/events` | Sistemdeki tüm etkinlikleri listeler. | Açık |
| `GET` | `/event/{id}` | Belirli bir etkinliğin detaylarını getirir. | Açık |
| `GET` | `/upload-url` | S3'e doğrudan dosya yükleyebilmek için güvenli, geçici bir (Pre-signed) URL üretir. | **Cognito** |

*Not: Arka planda `processEvent` adında bir SQS Worker Lambda fonksiyonu, gelen mesajları dinleyerek işlemektedir.*

## 🛠 Kurulum ve Geliştirme

**Gereksinimler:**
- Node.js (v18 veya v20)
- AWS CLI (Yapılandırılmış ve geçerli kimlik bilgilerine sahip)
- Serverless Framework v4

**Adımlar:**

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. Projeyi AWS hesabınıza dağıtın (deploy):
   ```bash
   serverless deploy
   ```

3. Geliştirme ortamında (lokal olarak) test etmek için:
   ```bash
   serverless dev
   ```

Herhangi bir sorunuz olursa veya katkıda bulunmak isterseniz, Issues sekmesini kullanabilirsiniz.
