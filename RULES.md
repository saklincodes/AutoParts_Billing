# PROJECT RULES

## 1. E Drive Only — No C Drive
Ei project er shob kichu **E drive** e hote hobe. C drive use kora jabena.

### Already Configured:
- Python: `E:\python312` (C te sudhu junction pointer, 0 bytes)
- Pip cache: `E:\autoparts_billing_cache\pip`
- Project code: `E:\Autoparts_Billing`
- Database: `E:\Autoparts_Billing\db.sqlite3`
- Logs/temp: `E:\autoparts_billing_cache`

### Future kaj e mone rakhte hobe:
- Kono library install korle C te jabe na
- Kono file create korle E te hobe
- Kono config ba cache E drive e set korte hobe
- `pip install` korleo C te cache na rakhbe (already E te set kora)

## 2. Ami (AI) er jonno rules
- Ami kono kichu C drive e create/install korbo na
- Kichu install korar age check korbo je E drive e hocche kina
- Kono file read/write korle E drive e korbo
- Kono doubt thakle age user ke jigesh korbo

## 3. Server Run
```
cd E:\Autoparts_Billing
python manage.py runserver 0.0.0.0:8000
```
Or: double click `start_server.bat`

## 4. Important Paths
| Item | Path |
|---|---|
| Django project | `E:\Autoparts_Billing\` |
| Python | `E:\python312\` |
| Frontend files | `E:\Autoparts_Billing\stitch_autoparts_billing_pro\stitch_autoparts_billing_pro\` |
| Database | `E:\Autoparts_Billing\db.sqlite3` |
| Admin panel | `http://localhost:8000/admin/` (user: admin, pass: admin123) |
