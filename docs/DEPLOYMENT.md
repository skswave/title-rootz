# Title Rootz Global — Deployment & Operations

## Server

| Item | Value |
|------|-------|
| Host | `ubuntu@141.148.25.214` (Oracle Cloud, Always Free ARM) |
| Disk | 193GB total, ~98GB used (51%) |
| Path | `/var/www/title.rootz.global/` |
| PM2 | `title-records` (id 24), port 3035 |
| Nginx | `/etc/nginx/sites-enabled/title.rootz.global.conf` |
| URL | `https://title.rootz.global` |

## Common Operations

### Restart the server
```bash
ssh ubuntu@141.148.25.214 "pm2 restart title-records"
```

### View logs
```bash
ssh ubuntu@141.148.25.214 "pm2 logs title-records --lines 50"
```

### Check status
```bash
ssh ubuntu@141.148.25.214 "pm2 show title-records"
```

### Deploy code changes
```bash
cd land-records/mcp-server
scp server.mjs fl-query.mjs oh-query.mjs ubuntu@141.148.25.214:/var/www/title.rootz.global/
ssh ubuntu@141.148.25.214 "pm2 restart title-records"
```

### Check data health
```bash
# FL parcel count (should be ~10.8M)
ssh ubuntu@141.148.25.214 "python3 -c 'import json; d=json.load(open(\"/var/www/title.rootz.global/data/florida/cities/_index.json\")); print(sum(x[\"count\"] for x in d))'"

# OH parcel counts
ssh ubuntu@141.148.25.214 "wc -l /var/www/title.rootz.global/data/ohio/*.jsonl"

# Disk usage
ssh ubuntu@141.148.25.214 "du -sh /var/www/title.rootz.global/data/florida/ /var/www/title.rootz.global/data/ohio/"
```

### Test API endpoints
```bash
# FL search
curl "https://title.rootz.global/api/fl/search?address=179+Harbor+Dr&city=Key_Biscayne"

# OH search
curl "https://title.rootz.global/api/oh/search?address=6580+SHERRY+LN&city=Hilliard"

# Health check
curl "https://title.rootz.global/health"
```

## Scheduled Updates (Cron)

| Schedule | Command | What It Does |
|----------|---------|-------------|
| `0 0,6,12,18 * * *` | `scraper-monitor.mjs` | Source health check — tests if county GIS endpoints respond (4x daily) |
| `0 3 15 * *` | `refresh.mjs --parcels` | Full FL parcel re-pull from DOR statewide data (monthly 15th, 3am UTC) |
| `0 4 * * 1` | `refresh.mjs --permits` | Building permits refresh — Miami-Dade + Broward + Brevard (weekly Monday) |
| `0 5 1 * *` | `refresh.mjs --schools --roads` | Schools + road data refresh (monthly 1st) |
| `0 6 15 1 *` | `refresh.mjs --census` | Census block group refresh (annual January 15) |
| `0 6 * * *` | `pull-broward-clerk.mjs --daily --rebuild-db` | Broward Clerk daily records + SQLite rebuild (daily 6am UTC) |
| `0 7 1 * *` | `pull-ohio.mjs --county all` | Ohio parcel refresh, all ready counties (monthly 1st) |
| `0 8 1 * *` | `pull-dbpr-licenses.mjs` | DBPR vacation rental licenses statewide (monthly 1st) |

### Full crontab (copy to server)
```bash
# Title Rootz data refresh — /var/www/title.rootz.global/
0 0,6,12,18 * * * cd /var/www/title.rootz.global && node scraper-monitor.mjs >> /var/log/title-monitor.log 2>&1
0 3 15 * *       cd /var/www/title.rootz.global && node refresh.mjs --parcels >> /var/log/title-refresh.log 2>&1
0 4 * * 1        cd /var/www/title.rootz.global && node refresh.mjs --permits >> /var/log/title-refresh.log 2>&1
0 5 1 * *        cd /var/www/title.rootz.global && node refresh.mjs --schools --roads >> /var/log/title-refresh.log 2>&1
0 6 * * *        cd /var/www/title.rootz.global && node pull-broward-clerk.mjs --daily --rebuild-db >> /var/log/title-clerk.log 2>&1
0 6 15 1 *       cd /var/www/title.rootz.global && node refresh.mjs --census >> /var/log/title-refresh.log 2>&1
0 7 1 * *        cd /var/www/title.rootz.global && node pull-ohio.mjs --county all >> /var/log/title-refresh.log 2>&1
0 8 1 * *        cd /var/www/title.rootz.global && node pull-dbpr-licenses.mjs >> /var/log/title-refresh.log 2>&1
0 9 * * 1        cd /var/www/title.rootz.global && node refresh.mjs --ce >> /var/log/title-refresh.log 2>&1
```

### Logs for cron jobs
```bash
ssh ubuntu@141.148.25.214 "tail -50 /var/log/title-refresh.log"
ssh ubuntu@141.148.25.214 "tail -50 /var/log/title-monitor.log"
ssh ubuntu@141.148.25.214 "tail -50 /var/log/title-clerk.log"
```

## Data Layout on Server

```
/var/www/title.rootz.global/
├── server.mjs              ← Main server (HTTP + MCP)
├── fl-query.mjs            ← Florida intelligence engine
├── oh-query.mjs            ← Ohio intelligence engine
├── refresh.mjs             ← Data refresh script (cron target)
├── scraper-monitor.mjs     ← Source health monitor (cron target)
├── openapi.json            ← OpenAPI 3.1.0 spec
├── landing.html            ← Web UI
├── data/
│   ├── florida/
│   │   ├── cities/              ← 1,270 city-indexed JSONL files (12GB)
│   │   │   ├── _index.json      ← City name → record count index
│   │   │   ├── JACKSONVILLE.jsonl (377K records)
│   │   │   ├── ORLANDO.jsonl     (332K records)
│   │   │   ├── TAMPA.jsonl       (258K records)
│   │   │   └── ... (635 real cities)
│   │   ├── building-permits.json           (511MB, Miami-Dade)
│   │   ├── broward-fort-lauderdale-permits.json (210MB)
│   │   ├── brevard-palm-bay-permits.json   (78MB)
│   │   ├── statewide-schools-public.json   (1.4MB)
│   │   ├── statewide-schools-private.json  (556KB)
│   │   ├── statewide-hospitals.json        (353KB)
│   │   ├── statewide-ev-charging.json      (14MB)
│   │   ├── statewide-epa-tri.json          (3.3MB)
│   │   ├── statewide-census-blockgroups.json (3.8MB)
│   │   ├── statewide-fred-economics.json   (58KB)
│   │   ├── federal-fema-disasters.json     (2.8MB)
│   │   ├── federal-fema-nfip-by-zip.json   (66KB)
│   │   ├── federal-irs-soi-income.csv      (7.4MB)
│   │   └── bls-cpi-miami.json             (3.6KB)
│   ├── ohio/
│   │   ├── franklin-parcels.jsonl  (494K records, 1.1GB)
│   │   ├── hamilton-parcels.jsonl  (329K records, 751MB)
│   │   ├── cuyahoga-parcels.jsonl  (420K records, 1.7GB)
│   │   └── cities/                 ← City-indexed OH files
│   ├── properties/                 ← MA property JSON files
│   └── cache/                      ← SHA-256 hashed lookups
```

## Known Gaps

1. **FL Permits** — only 3 of 67 counties (Miami-Dade, Broward, Brevard). Need statewide expansion.
2. **OH counties** — Montgomery (Dayton) and Summit (Akron) pull failed. ArcGIS field encoding issue.
3. **City indexing** — 635 of 1,270 "city" entries are garbage (boat names, condo names from bad data). Real cities work fine.
4. **No automated OH refresh** — manual pulls only. Need cron like FL.
5. **No farming-specific API** — signals are embedded in `/api/fl/search` response. May want dedicated `/api/fl/farm?city=X&signals=absentee,longterm` endpoint.

## Related PM2 Services on Same Server

The title-records service runs alongside 23 other Rootz services. Key related ones:
- `private-companies` — FL/NY business entities (cross-ref target)
- `origin-registry` — SEC public companies (cross-ref target)
- `cars-rootz`, `rental-rootz`, `ship-intel`, `politics-rootz` — sibling Rootz verticals
