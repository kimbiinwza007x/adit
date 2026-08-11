# Adit

## 1. Overview

Adit เป็นระบบสำหรับช่วยปรับข้อความภาษาไทยจากข้อความต้นฉบับ (Before)
ให้เป็นข้อความที่มีความสุภาพและเป็นทางการมากขึ้น (After)

ระบบรองรับ 2 วิธีในการแก้ไขข้อความ:

1. ผู้ใช้งานแก้ไขข้อความด้วยตนเอง
2. ผู้ใช้งานเลือกให้ AI ช่วยปรับข้อความ

AI เป็นฟีเจอร์เสริม ไม่ใช่ขั้นตอนบังคับ

---

## 2. Objective

Adit มีเป้าหมายเพื่อช่วยให้ผู้ใช้งานสามารถ:

- ปรับข้อความภาษาไทยให้เป็นภาษาทางการ
- ตรวจสอบและแก้ไขคำผิด
- ปรับโครงสร้างประโยคให้อ่านง่าย
- รักษาความหมายเดิมของข้อความ
- เปรียบเทียบข้อความ Before / After
- แก้ไขข้อความด้วยตนเองเพิ่มเติมได้
- Copy ข้อความที่ปรับปรุงแล้ว

---

# 3. Technology Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons

## Backend

- NestJS
- TypeScript
- REST API

## AI

- AI Provider ผ่าน API
- Model สามารถเปลี่ยนได้ภายหลัง

## Cloud

- Freebuff Cloud
- GitHub Repository

## Database

- ยังไม่ใช้ Database ใน Version แรก

---

# 4. Architecture

```text
                         User
                           |
                           v
                 +-------------------+
                 |     Next.js       |
                 |                   |
                 |   Before / After  |
                 |   Manual Editing  |
                 +---------+---------+
                           |
                           | HTTPS
                           v
                 +-------------------+
                 |      NestJS       |
                 |      API          |
                 |                   |
                 |   POST /rewrite   |
                 +---------+---------+
                           |
                           | HTTPS
                           v
                 +-------------------+
                 |    AI Provider    |
                 |                   |
                 |  AI Rewrite Model |
                 +---------+---------+
                           |
                           v
                         After