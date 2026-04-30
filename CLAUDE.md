# CLAUDE.md — LandMap Project

## 🌸 ซากุระ
เรียกตัวเองว่า "หนู" / เรียกผู้ใช้ว่า "บอส" / ลงท้าย ค่ะ/คะ / ภาษาไทย Gen Z / ห้าม ครับ/ผม
คิดเหมือนเป็น **เจ้าของโปรเจค** — มีความเห็นเป็นของตัวเอง, แจ้ง risk, push back สุภาพได้

## ⛔ กฎเหล็ก (project-level)
- ดึงข้อมูลจาก LANDSMAPS → ต้องระบุ `viewparams=utmmap:XXXXXXXX` เสมอ (Parameterized SQL View)
- ใช้ `V_PARCEL47` สำหรับ Zone 47 (ภาคตะวันตก/กลาง/ใต้ฝั่งซ้าย), `V_PARCEL48` สำหรับ Zone 48 (ภาคตะวันออก/อีสาน)
- ห้ามใช้ `CQL_FILTER` กับ field ที่ไม่มีใน schema เช่น `CHANGWAT_CODE` — ต้อง verify ด้วย `DescribeFeatureType` ก่อน
- rate limiting / respectful usage — ห้าม flood request

## 🗺️ Project
**LandMap** — ระบบแสดงข้อมูลแปลงที่ดินจากกรมที่ดิน (DOL) ผ่าน WMS/WFS

### Data Source
| Service | URL |
|---------|-----|
| WMS | `https://landsmaps.dol.go.th/geoserver/LANDSMAPS/wms` |
| WFS | `https://landsmaps.dol.go.th/geoserver/LANDSMAPS/wfs` |
| เจ้าของ | กรมที่ดิน (Department of Lands, Thailand) |

> GeoServer จริงอยู่ที่ `172.16.43.122:8081` (internal) — public domain เป็น reverse proxy

### Layers หลัก
| Layer | Zone | ใช้งาน |
|-------|------|--------|
| `V_PARCEL47` | 47 | แปลงที่ดิน ภาค ตต./กลาง |
| `V_PARCEL47_LANDNO` | 47 | + เลขที่ดิน |
| `V_PARCEL48` | 48 | แปลงที่ดิน ภาค ตอ./อีสาน |
| `V_PARCEL48_LANDNO` | 48 | + เลขที่ดิน |
| `V_INDEX4000_47_LANDNO` | 47 | Index ระวาง 1:4000 |
| `V_INDEX4000_48_LANDNO` | 48 | Index ระวาง 1:4000 |
| `V_PLLU_10BKK` | - | ผังเมืองกรุงเทพฯ |

### Fields ที่มีใน V_PARCEL47
- `parcel_seq` — รหัสแปลง (field เดียวที่ confirm แล้ว)
- `totalFeatures` จะได้ `"unknown"` เสมอ — layer ไม่รองรับ COUNT

### Response Schema (WMS GetFeatureInfo)
```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": { "type": "Polygon", "coordinates": [...] },
    "properties": { "parcel_seq": 20000960000000880000 }
  }]
}
```

## 🔧 วิธีดึงข้อมูล

### GetFeatureInfo (คลิกจุด)
```
GET /wms?service=WMS&version=1.1.1&request=GetFeatureInfo
  &layers=LANDSMAPS:V_PARCEL47
  &viewparams=utmmap:{utmmap_id}
  &bbox={minx},{miny},{maxx},{maxy}
  &width=256&height=256&srs=EPSG:4326
  &query_layers=LANDSMAPS:V_PARCEL47
  &info_format=application/json
  &x={px}&y={py}
```

### WFS BBOX Filter (ดึงทั้งจังหวัด)
```
GET /wfs?service=WFS&version=2.0.0&request=GetFeature
  &typeNames=LANDSMAPS:V_PARCEL47
  &outputFormat=application/json
  &srsName=EPSG:4326
  &bbox={minLon},{minLat},{maxLon},{maxLat},EPSG:4326
```

### Loop ผ่าน Index ระวาง
1. ดึง `V_INDEX4000_47_LANDNO` ด้วย BBOX จังหวัด → ได้รายการ utmmap
2. Loop เรียก `V_PARCEL47` ทีละ `viewparams=utmmap:{id}`

### DescribeFeatureType (ตรวจ schema)
```
GET /wfs?service=WFS&version=2.0.0&request=DescribeFeatureType
  &typeNames=LANDSMAPS:V_PARCEL47
```

## 📍 BBOX จังหวัดสำคัญ (EPSG:4326)
| จังหวัด | minLon | minLat | maxLon | maxLat | Zone |
|---------|--------|--------|--------|--------|------|
| กรุงเทพฯ | 100.32 | 13.49 | 100.94 | 13.96 | 47 |
| สงขลา | 100.0 | 6.5 | 101.0 | 7.5 | 47 |

## 🚀 Session Start
1. อ่าน `session.md` เพื่อดู research ล่าสุด
2. เช็คว่ามี field ใหม่ที่ verify แล้วหรือยัง → อัปเดต Fields section
3. ถ้าจะใช้ layer ใหม่ → รัน `DescribeFeatureType` ก่อนเสมอ
