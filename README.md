# 🛍️ Trendyol Akıllı Fiyatlandırma & Buybox Radarı

Trendyol satıcıları için özel olarak geliştirilmiş **Varyant/Perde Formül Motoru** ve **Otomatik Repricer & Buybox Radarı**.

---

## 🌟 Temel Yetenekler

1. **Toplu Formüllü Varyant Fiyatlandırma (Perde, Tekstil vb.):**
   * Kumaş m² maliyeti, dikiş işçiliği, kargo baremi, paketleme gideri, Trendyol komisyon oranı ve hedef kâr marjını girin.
   * Onlarca ölçü/varyantın fiyatını saniyeler içinde hesaplayın ve tek tıkla Trendyol'a yükleyin.
   * Psikolojik fiyatlandırma (.90 TL) desteği.

2. **7/24 Buybox Radarı & Telegram Alarmları:**
   * Takipteki ürünler için rakiplerin fiyat kırıp kırmadığını periyodik izler.
   * Buybox kaybedildiğinde satıcının Telegram'ına formatlı anlık uyarı mesajı yollar.

3. **Akıllı Repricer & Taban Güvenlik Kilidi (Safety Stop):**
   * Rakip fiyat kırarsa belirlenen stratejiye göre (örn: Rakipten 0.50 TL daha ucuz ol) fiyatı otomatik günceller.
   * **Güvenlik Kilidi:** Eğer rakip zararına satış yapıyorsa, sistem formülün belirlediği **minimum kârlı taban fiyatın altına asla inmez** ve satıcıya Telegram'dan alarm gönderir.

4. **Simülasyon & Demo Modu:**
   * Trendyol API anahtarınız olmasa bile hazır demo perde veri seti ve rakip saldırı simülatörüyle sistemi anında test edebilirsiniz.

---

## 🚀 Hızlı Başlangıç

### 1. Kolay Başlatma (Windows)
Klasör içerisindeki `start.bat` dosyasına çift tıklayarak hem Backend'i hem de Frontend'i otomatik başlatabilirsiniz.

### 2. Manuel Başlatma

#### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* API Dokümantasyonu (Swagger): `http://127.0.0.1:8000/docs`

#### Frontend (React + Tailwind)
```bash
cd frontend
npm install
npm run dev
```
* Web Paneli: `http://localhost:3000`
