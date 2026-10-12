# วิธีแก้ GitHub Pages แสดงหน้าเปล่า / 404 (ฉบับใช้งานง่าย)

**ไฟล์ชุดนี้มี GitHub Actions ที่ Build React + Vite และ Deploy อัตโนมัติแล้ว**

## สาเหตุที่ไฟล์รุ่นก่อนอาจเปิดไม่ได้

ไฟล์ต้นฉบับ `index.html` ชี้ไปยัง `/src/main.jsx` ซึ่งเป็นโค้ดสำหรับให้ **Vite Build** ก่อนเปิดบนเว็บไซต์จริง GitHub Pages แบบ "Deploy from a branch" จะไม่ติดตั้ง dependencies หรือ Build React ให้เอง ถ้าเลือก `main` + `/(root)` จะเป็นการเผยแพร่ไฟล์ต้นฉบับ และเว็บอาจแสดงเป็นหน้าขาวหรือเกิดข้อผิดพลาดใน Console

## ขั้นตอน Deploy แนะนำ (ไม่ต้องใช้ Terminal)

1. ไปที่ Repository บน GitHub ที่คุณใช้สำหรับโปรเจกต์นี้
2. อัปโหลด **เนื้อหาทั้งหมดหลังแตก ZIP** ลงที่ **root ของ Repository** (ระดับเดียวกับ `index.html` และ `package.json`) อย่าอัป ZIP ทั้งก้อน และอย่าให้ไฟล์ทั้งหมดอยู่ในโฟลเดอร์ซ้อนอีกชั้น
3. ต้องมีไฟล์ `.github/workflows/deploy.yml` อยู่จริงใน Repository ด้วย (Mac อาจซ่อนโฟลเดอร์ `.github` ให้กด `Command + Shift + .` เพื่อแสดงไฟล์ที่ซ่อน หากอัปโหลดผ่าน GitHub ต้องแน่ใจว่าโฟลเดอร์ `.github` ถูกอัปโหลดด้วย)
4. กด Commit changes เข้า branch `main` หรือ `master`
5. เปิด **Settings → Pages → Build and deployment → Source** แล้วเลือก **GitHub Actions** (ไม่ใช่ "Deploy from a branch")
6. เปิดแท็บ **Actions** ของ Repository เลือก **Deploy Wedding Fabric Calculator** หากยังไม่รัน ให้กด **Run workflow** → **Run workflow**
7. รอทั้งงาน `Test and build website` และ `Publish website` แสดงสีเขียว จากนั้นเข้า URL ที่หน้า **Settings → Pages** ให้มา

รูปแบบ URL ทั่วไป:

- Repository ชื่อ `wedding-fabric-calculator`: `https://USERNAME.github.io/wedding-fabric-calculator/`
- Repository ชื่อ `USERNAME.github.io`: `https://USERNAME.github.io/`

## ถ้าเว็บยังเปิดไม่ได้

| อาการ | จุดตรวจ |
| --- | --- |
| 404 Not Found | เปิด `Settings → Pages` ดู URL จริง, แท็บ Actions ต้อง Deploy สำเร็จ, สะกด repo และชื่อบัญชีให้ตรง |
| หน้าขาว / Loading ไม่ขึ้น | เปิด **Developer Tools → Console** ดู error; เช็กว่าเลือก Source = GitHub Actions ไม่ใช่ main branch |
| Action เป็นสีแดงใน `Install dependencies` | แคป Error log ส่งมา; อาจเป็น dependency/network/registry |
| Action เป็นสีแดงใน `Run calculation tests` | มี test ไม่ผ่าน; ส่ง log ส่วนนั้นมา |
| Action เป็นสีแดงใน `Build static website` | มี import/JSX/package ผิด; ส่ง log ส่วนนั้นมา |
| Action เป็นสีแดงใน `Publish website` | ตรวจ Pages source, Settings → Actions → General → Workflow permissions, และนโยบายองค์กร |
| UI โหลดแต่ 3D ไม่แสดง | ต้องเป็นเบราว์เซอร์ที่รองรับ WebGL; ลอง Chrome หรือ Safari รุ่นปัจจุบัน |
| เปิดหน้า GitHub Repository แทนเว็บไซต์ | ลิงก์ github.com/... เป็นลิงก์ Source Code ไม่ใช่เว็บไซต์จริง ต้องใช้ URL github.io/... |

> **หมายเหตุเรื่องการทดสอบ:** ระบบก่อนส่ง ZIP ตรวจชุด Smoke Tests และ Syntax ของโมดูลคำนวณได้แล้ว แต่สภาพแวดล้อมของผู้จัดทำไม่ได้เชื่อม npm registry จึงไม่สามารถรับประกันว่า `npm install`, `npm test` และ Production Build จะผ่านจนกว่า GitHub Actions จะรันจริง หาก Action ขึ้นแดง โปรดส่งภาพ log หรือ URL Repository มาให้ตรวจต่อ

## วิธีรันบนเครื่อง

```bash
npm install
npm test
npm run build
npm run dev
```

> ตัวเว็บไม่ต้องใช้ Backend และไม่มี API key สำหรับการทำงานหลัก ประวัติถูกเก็บใน localStorage ของเบราว์เซอร์นั้น ๆ
