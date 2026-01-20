# ParentControl App

Ứng dụng quản lý và kiểm soát thiết bị dành cho phụ huynh, được xây dựng bằng React Native.

## 1. Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:

-   **Node.js** (Phiên bản 18+ được khuyến nghị)
-   **Java Development Kit (JDK) 17** (Cần thiết cho Android builds)
-   **Android Studio** (Bao gồm Android SDK và Emulator)
-   **Git**

## 2. Hướng dẫn Clone và Cài đặt (Installation)

### Clone source code
Mở terminal và chạy lệnh sau để tải source code về máy:

```bash
git clone <URL_REPO_CUA_BAN>
cd ParentControl
```
*(Thay `<URL_REPO_CUA_BAN>` bằng link git thực tế của bạn)*

### Cài đặt thư viện
Chạy lệnh sau để cài đặt các package cần thiết:

```bash
npm install
# Hoặc nếu bạn dùng yarn
yarn install
```

## 3. Chạy ứng dụng trên Emulator (Testing)

### Bước 1: Khởi động Metro Bundler
Mở một cửa sổ terminal mới và chạy:

```bash
npm start
```

### Bước 2: Chạy ứng dụng trên Android Emulator
Đảm bảo bạn đã mở Android Emulator (từ Android Studio) hoặc kết nối thiết bị Android thật vào máy tính.

Mở một cửa sổ terminal khác và chạy:

```bash
npm run android
```

Nếu thành công, ứng dụng sẽ tự động được cài đặt và mở trên Emulator.

> **Lưu ý:** Nếu gặp lỗi liên quan đến `gradle`, hãy thử chạy `cd android && ./gradlew clean` sau đó quay lại thư mục gốc và chạy lại lệnh trên.

## 4. Hướng dẫn Build Release APK

Để tạo file APK dùng để cài đặt thủ công hoặc upload lên store:

### Bước 1: Tạo Keystore (Nếu chưa có)
Nếu bạn chưa có keystore, hãy chạy lệnh sau trong thư mục `android/app` để tạo:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
*Lưu ý: Bạn cần bảo mật file keystore này. Nếu mất, bạn sẽ không thể update app trên Google Play.*

### Bước 2: Thiết lập biến môi trường
Kiểm tra file `android/gradle.properties`, đảm bảo các thông tin sau đã được cấu hình chính xác (hoặc cấu hình trong file `local.properties` để bảo mật):

```properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****
```

### Bước 3: Chạy lệnh Build
Từ thư mục gốc của dự án, chạy lệnh:

```bash
cd android
./gradlew assembleRelease
```

Sau khi chạy xong, file APK sẽ nằm tại:
`android/app/build/outputs/apk/release/app-release.apk`

> **Build AAB (Android App Bundle):** Google Play hiện khuyến nghị dùng AAB thay vì APK. Để build AAB, chạy lệnh:
> `./gradlew bundleRelease`
> File kết quả: `android/app/build/outputs/bundle/release/app-release.aab`

## 5. Hướng dẫn đẩy lên Google Play (Deployment)

### Bước 1: Tạo ứng dụng trên Google Play Console
1.  Truy cập [Google Play Console](https://play.google.com/console).
2.  Nhấn nút **Create app**.
3.  Điền thông tin Cơ bản (Tên App, Ngôn ngữ, Loại App: App/Game, Free/Paid).
4.  Hoàn thành các bước xác nhận chính sách.

### Bước 2: Thiết lập trang cửa hàng (Store Listing)
1.  Vào mục **Main store listing**.
2.  Cập nhật:
    *   Tên hiển thị, Mô tả ngắn, Mô tả đầy đủ.
    *   Icon (512x512 png).
    *   Ảnh chụp màn hình (Screenshots) cho điện thoại và tablet.
    *   Ảnh bìa (Feature graphic - 1024x500).

### Bước 3: Upload bản build
1.  Trong menu bên trái, chọn **Production** (để release chính thức) hoặc **Testing** (Internal/Open/Closed testing).
2.  Nhấn **Create new release**.
3.  Tại mục **App bundles**, upload file `.aab` bạn đã build ở **Mục 4**.
4.  Đặt tên cho bản release (Release name) và viết ghi chú cập nhật (Release notes).
5.  Nhấn **Next** -> **Save** -> **Go to Overview** -> **Send changes for review**.

Ứng dụng sẽ được đội ngũ Google review (thường mất 1-3 ngày) trước khi được publish.
