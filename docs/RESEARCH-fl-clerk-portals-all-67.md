# Florida County Clerk of Court — Official Records Search Portal Catalog

**Date:** 2026-05-15
**Purpose:** Platform classification for scraper development by platform type
**Coverage:** All 67 FL counties

---

## PLATFORM SUMMARY

| Platform | County Count | Notes |
|----------|-------------|-------|
| **Landmark Web** (Pioneer Technology Group) | ~15 | Most common platform. Sanford, FL company. Consistent URL patterns. |
| **AcclaimWeb** (Harris Recording / Hyland) | ~6 | Broward has FREE SFTP. Consistent `/AcclaimWeb/` URL pattern. |
| **MyFloridaCounty ORI** (CiviTek/NIC) | ~15 | Many small/rural counties redirect here. State-level portal. |
| **Custom / In-House** | ~12 | Large counties (Miami-Dade, Orange, Hillsborough, Duval, etc.) |
| **CivitekFlorida OCRS** | ~10+ | Court records (not official records). Many small counties. |
| **KoFile QuickLinks** | ~8 | Historical/archived records supplement, not primary search. |
| **DuProcess** | 1-2 | Seminole County primary. Electronic recording platform. |
| **Image One COR** | 1-2 | Collier County. ShowCase portal. |
| **ClerkNet** | 1 | Sarasota. Custom branded. |
| **BrowserView** | 1 | Polk County. Custom branded. |
| **EagleRecorder** | 1 | Orange County Comptroller. |

---

## TIER 1: TOP 20 COUNTIES (85%+ of FL population)

### 1. Miami-Dade — Pop ~2.7M
- **URL:** https://onlineservices.miamidadeclerk.gov/officialrecords
- **Platform:** Custom (County Recorder's Official Records Online System)
- **Bulk Data:** YES — Commercial Data Services. FTP $420/mo for OR images, API $0.20/unit. Register at www2.miamidadeclerk.gov/developers
- **Notes:** Paid search ($1/unit). Largest county. Records from 1974+.

### 2. Broward — Pop ~1.9M
- **URL:** https://officialrecords.broward.org/AcclaimWeb
- **Platform:** AcclaimWeb (Harris/Hyland)
- **Bulk Data:** YES — FREE SFTP. 10 days of quality-assured images + index. Records from 1978+. Call 954-831-4000.
- **Notes:** Best free bulk data in FL. Key target.

### 3. Palm Beach — Pop ~1.5M
- **URL:** https://erec.mypalmbeachclerk.com/
- **Platform:** Landmark Web (Pioneer Technology Group)
- **Bulk Data:** YES — FTP subscription $600/year (index only, no images). Contact ORWEB@mypalmbeachclerk.com
- **Notes:** Free public search. Records from 1968+.

### 4. Hillsborough — Pop ~1.5M
- **URL:** https://publicaccess.hillsclerk.com/oripublicaccess/
- **Platform:** Custom (ORI Public Access)
- **Bulk Data:** PARTIAL — CSV public data files (court cases, monthly). See hillsclerk.com/records-and-reports/public-data-files
- **Notes:** Alt URL: pubrec6.hillsclerk.com/ORIPublicAccess/. Records from 1836+.

### 5. Orange — Pop ~1.4M
- **URL (Court):** https://myeclerk.myorangeclerk.com/
- **URL (Official Records):** https://selfservice.or.occompt.com/ssweb/ and https://or.occompt.com/recorder/web/
- **Platform:** EagleRecorder (Official Records via Comptroller), myeClerk (Court Records via Clerk)
- **Bulk Data:** Unknown
- **Notes:** Split jurisdiction — Comptroller handles official records, Clerk handles court records.

### 6. Pinellas — Pop ~1.0M
- **URL:** https://officialrecords.mypinellasclerk.gov/
- **Platform:** Unknown/Custom
- **Bulk Data:** Unknown
- **Notes:** Contact Recording Services: 727-464-3223.

### 7. Duval (Jacksonville) — Pop ~1.0M
- **URL:** https://or.duvalclerk.com/
- **Platform:** Custom (OnCore-based). CORE for court records.
- **Bulk Data:** Unknown
- **Notes:** Records from 1988+. Marriage licenses from 1981+.

### 8. Lee — Pop ~800K
- **URL:** https://or.leeclerk.org/LandMarkWeb/
- **Platform:** Landmark Web (Pioneer Technology Group)
- **Bulk Data:** Daily images, indices, and plat downloads mentioned on site.
- **Notes:** Records from 1887+. Free public search.

### 9. Polk — Pop ~750K
- **URL:** https://apps.polkcountyclerk.net/browserviewor/
- **Platform:** BrowserView (custom/in-house)
- **Bulk Data:** Unknown
- **Notes:** Free search. Records from 1957+. Historical deeds 1861-1956 via KoFile.

### 10. Brevard — Pop ~620K
- **URL:** https://vaclmweb1.brevardclerk.us/AcclaimWeb/
- **Platform:** AcclaimWeb (Harris/Hyland)
- **Bulk Data:** Unknown
- **Notes:** Free, no password required. Contact: acclaimuseradmin@brevardclerk.us

### 11. Volusia — Pop ~570K
- **URL:** https://app02.clerk.org/or_m/
- **Platform:** Custom (in-house)
- **Bulk Data:** Unknown
- **Notes:** Records from April 4, 1988+. New mobile-friendly interface.

### 12. Seminole — Pop ~480K
- **URL:** https://recording.seminoleclerk.org/
- **Platform:** DuProcess
- **Bulk Data:** Unknown
- **Notes:** Records from January 1, 1983+. Digitizing back to 1913.

### 13. Pasco — Pop ~570K
- **URL:** https://www.pascoclerk.com/333/Pasco-County-Official-Records-Search
- **Platform:** MyFloridaCounty ORI / CiviTek
- **Bulk Data:** Unknown
- **Notes:** Also uses CivitekFlorida OCRS for court records. Historical via KoFile (1876-1974).

### 14. Sarasota — Pop ~450K
- **URL:** https://secure.sarasotaclerk.com/OfficialRecords.aspx
- **Platform:** ClerkNet 3.0 (custom/branded)
- **Bulk Data:** Unknown
- **Notes:** Contact (941) 861-7400.

### 15. Manatee — Pop ~420K
- **URL:** https://records.manateeclerk.com/OfficialRecords/Search
- **Platform:** Custom (Public Records Hub — consolidating all searches)
- **Bulk Data:** Unknown
- **Notes:** Records from 1978+. Images from May 15, 1981+. Uses TrieData for e-Certify.

### 16. Collier — Pop ~400K
- **URL:** https://app.collierclerk.com/CORPublicAccess/Search/Document
- **Platform:** Image One COR (ShowCase for court records)
- **Bulk Data:** Unknown
- **Notes:** COR system in use 13+ years. Court records at cms.collierclerk.com.

### 17. Marion — Pop ~385K
- **URL:** https://nvweb.marioncountyclerk.org/BrowserView/
- **Platform:** BrowserView (same as Polk)
- **Bulk Data:** Unknown
- **Notes:** Also CivitekFlorida OCRS for court records.

### 18. Lake — Pop ~380K
- **URL:** https://officialrecords.lakecountyclerk.org/
- **Platform:** Harris Recording Solutions (AcclaimWeb variant)
- **Bulk Data:** Unknown
- **Notes:** Court records at courtrecords.lakecountyclerk.org.

### 19. Osceola — Pop ~400K
- **URL:** https://officialrecords.osceolaclerk.org/searchng_ssl/
- **Platform:** Custom (searchng — possible Harris/AcclaimWeb variant)
- **Bulk Data:** Unknown
- **Notes:** PERCH Search branding.

### 20. St. Lucie — Pop ~360K
- **URL:** https://stlucieclerk.gov/public-search-gen/official-records-search
- **Platform:** AcclaimWeb (confirmed: acclaimweb.stlucieclerk.gov)
- **Bulk Data:** Unknown
- **Notes:** Records from 1985+.

---

## TIER 2: COUNTIES 21-40

### 21. Escambia — Pop ~320K
- **URL:** https://dory.escambiaclerk.com/LandmarkWeb
- **Platform:** Landmark Web (Pioneer Technology Group)
- **Bulk Data:** Unknown

### 22. Leon (Tallahassee) — Pop ~300K
- **URL:** http://cvweb.leonclerk.com/public/clerk_services/official_records/official_records.asp
- **Platform:** CVweb (custom/in-house)
- **Bulk Data:** Unknown
- **Notes:** (850) 606-4030

### 23. Alachua (Gainesville) — Pop ~280K
- **URL:** https://alachuacounty.us/Depts/Clerk/PublicRecords/pages/officialrecords.aspx
- **Platform:** Custom (in-house, designed by Alachua County ITS, v2014)
- **Bulk Data:** Unknown
- **Notes:** Records from 1965+. Ancient records at alachuaclerk.org/archive/.

### 24. St. Johns — Pop ~290K
- **URL:** https://apps.stjohnsclerk.com/Landmark
- **Platform:** Landmark Web (Pioneer Technology Group)
- **Bulk Data:** Unknown

### 25. Okaloosa — Pop ~215K
- **URL:** https://clerkapps.okaloosaclerk.com/ClerkQuest/
- **Platform:** ClerkQuest (custom). Court CMS: Tyler Odyssey.
- **Bulk Data:** Unknown

### 26. Clay — Pop ~220K
- **URL:** https://landmark.clayclerk.com/landmarkweb
- **Platform:** Landmark Web (Pioneer Technology Group)
- **Bulk Data:** Unknown

### 27. Hernando — Pop ~200K
- **URL:** https://or.hernandoclerk.com/landmarkweb/
- **Platform:** Landmark Web (Pioneer Technology Group)
- **Bulk Data:** Unknown

### 28. Bay (Panama City) — Pop ~180K
- **URL:** http://records2.baycoclerk.com/recording/
- **Platform:** Landmark Web (Pioneer Technology Group)
- **Bulk Data:** Unknown

### 29. Santa Rosa — Pop ~190K
- **URL:** https://acclaim.srccol.com/AcclaimWeb/
- **Platform:** AcclaimWeb (Harris/Hyland)
- **Bulk Data:** Unknown

### 30. Charlotte — Pop ~190K
- **URL:** https://or.charlotteclerk.com/recording/
- **Platform:** Landmark Web (Pioneer Technology Group)
- **Bulk Data:** Unknown

### 31. Martin — Pop ~165K
- **URL:** https://or.martinclerk.com/landmarkweb/
- **Platform:** Landmark Web (Pioneer Technology Group)
- **Bulk Data:** Unknown
- **Notes:** Historical records via KoFile.

### 32. Indian River — Pop ~165K
- **URL:** https://landmark.indian-river.org/
- **Platform:** Landmark Web (Pioneer Technology Group)
- **Bulk Data:** Unknown

### 33. Citrus — Pop ~160K
- **URL:** https://search.citrusclerk.org/LandmarkWeb
- **Platform:** Landmark Web (Pioneer Technology Group)
- **Bulk Data:** Unknown
- **Notes:** Records indexed from 1980+ in PDF.

### 34. Flagler — Pop ~125K
- **URL:** https://apps.flaglerclerk.com/Landmark/
- **Platform:** Landmark Web (Pioneer Technology Group)
- **Bulk Data:** Unknown

### 35. Sumter — Pop ~135K
- **URL:** https://www.myfloridacounty.com/orisearch/60
- **Platform:** MyFloridaCounty ORI (CiviTek)
- **Bulk Data:** Unknown

### 36. Putnam — Pop ~75K
- **URL:** https://putnamclerk.com/county-recorder/official-records/
- **Platform:** MyFloridaCounty ORI (CiviTek)
- **Bulk Data:** Unknown

### 37. Nassau — Pop ~95K
- **URL:** https://www.nassauclerk.com/official-records/records-search
- **Platform:** MyFloridaCounty ORI (CiviTek) + custom historic (files.nassauclerk.com)
- **Bulk Data:** Unknown
- **Notes:** Historic records 1840-1982 at files.nassauclerk.com.

### 38. Monroe (Key West) — Pop ~80K
- **URL:** https://www.monroe-clerk.com/Cases/Search
- **Platform:** Custom
- **Bulk Data:** Unknown

### 39. Columbia — Pop ~72K
- **URL:** https://columbiaclerk.com/official-record-search/
- **Platform:** MyFloridaCounty ORI (CiviTek)
- **Bulk Data:** Unknown

### 40. Walton — Pop ~75K
- **URL:** https://orsearch.clerkofcourts.co.walton.fl.us/
- **Platform:** Landmark Web (Pioneer Technology Group)
- **Bulk Data:** Unknown

---

## TIER 3: COUNTIES 41-67 (SMALL/RURAL)

Most of these counties use **MyFloridaCounty ORI** (CiviTek) for official records search, and **CivitekFlorida OCRS** for court records. Many also have **KoFile QuickLinks** for historical records.

| # | County | Pop (approx) | Official Records URL | Platform |
|---|--------|-------------|---------------------|----------|
| 41 | Highlands | ~105K | acclaim.highlandsclerkfl.gov/AcclaimWeb | **AcclaimWeb** |
| 42 | Hendry | ~42K | myfloridacounty.com/orisearch/26 | MyFloridaCounty ORI |
| 43 | Okeechobee | ~42K | myfloridacounty.com/orisearch/47 | MyFloridaCounty ORI |
| 44 | Suwannee | ~45K | www.suwgov.org/county-recorder/official-records/ | MyFloridaCounty ORI |
| 45 | Jackson | ~48K | myfloridacounty.com/orisearch/32 | MyFloridaCounty ORI |
| 46 | DeSoto | ~38K | myfloridacounty.com/orisearch/19 | MyFloridaCounty ORI |
| 47 | Levy | ~43K | myfloridacounty.com/orisearch/36 | MyFloridaCounty ORI |
| 48 | Bradford | ~28K | bradfordclerk.com/official-records/ | MyFloridaCounty ORI |
| 49 | Baker | ~28K | myfloridacounty.com/orisearch/02 | MyFloridaCounty ORI |
| 50 | Gulf | ~16K | myfloridacounty.com/orisearch/23 | MyFloridaCounty ORI |
| 51 | Gadsden | ~45K | myfloridacounty.com/orisearch/22 | MyFloridaCounty ORI |
| 52 | Washington | ~25K | myfloridacounty.com/orisearch/67 | MyFloridaCounty ORI |
| 53 | Taylor | ~22K | myfloridacounty.com/orisearch/62 | MyFloridaCounty ORI |
| 54 | Wakulla | ~35K | wakullaclerk.org/landmarkweb | **Landmark Web** |
| 55 | Calhoun | ~14K | myfloridacounty.com/orisearch/07 | MyFloridaCounty ORI |
| 56 | Holmes | ~20K | myfloridacounty.com/orisearch/30 | MyFloridaCounty ORI |
| 57 | Madison | ~19K | myfloridacounty.com/orisearch/40 | MyFloridaCounty ORI |
| 58 | Liberty | ~8K | myfloridacounty.com/orisearch/39 | MyFloridaCounty ORI |
| 59 | Hamilton | ~14K | myfloridacounty.com/orisearch/24 | MyFloridaCounty ORI |
| 60 | Gilchrist | ~18K | myfloridacounty.com/orisearch/21 | MyFloridaCounty ORI |
| 61 | Jefferson | ~14K | myfloridacounty.com/orisearch/33 | MyFloridaCounty ORI |
| 62 | Union | ~16K | myfloridacounty.com/orisearch/64 | MyFloridaCounty ORI |
| 63 | Dixie | ~17K | myfloridacounty.com/orisearch/15 | MyFloridaCounty ORI |
| 64 | Hardee | ~27K | myfloridacounty.com/orisearch/25 | MyFloridaCounty ORI |
| 65 | Glades | ~13K | myfloridacounty.com/orisearch/22 | MyFloridaCounty ORI |
| 66 | Lafayette | ~8K | myfloridacounty.com/orisearch/35 | MyFloridaCounty ORI |
| 67 | Franklin | ~12K | myfloridacounty.com/orisearch/20 | MyFloridaCounty ORI |

---

## SCRAPER STRATEGY BY PLATFORM

### Priority 1: Landmark Web (Pioneer Technology Group) — ~15 counties
**One scraper serves:** Palm Beach, Lee, Escambia, St. Johns, Clay, Hernando, Bay, Charlotte, Martin, Indian River, Citrus, Flagler, Walton, Wakulla, and possibly more.

URL patterns:
- `*/LandmarkWeb/` or `*/Landmark/` or `*/landmarkweb/`
- Consistent search interface
- Pioneer Technology Group HQ: Sanford, FL
- **Write one scraper, configure per-county base URL**

### Priority 2: AcclaimWeb (Harris/Hyland) — ~6 counties
**One scraper serves:** Broward, Brevard, St. Lucie, Santa Rosa, Highlands, Lake (variant)

URL patterns:
- `*/AcclaimWeb/`
- Search types: SearchTypeName, SearchTypeRecordDate, SearchTypeBookPage
- **Broward has FREE SFTP — start here for bulk data**
- **Write one scraper, configure per-county base URL**

### Priority 3: MyFloridaCounty ORI (CiviTek/NIC) — ~20+ counties
**One scraper serves:** All small/rural counties using `myfloridacounty.com/orisearch/{county_id}`

URL pattern:
- `myfloridacounty.com/orisearch/{county_fips}`
- State-operated, standardized interface
- **Single scraper with county ID parameter**

### Priority 4: Custom Large County Portals — 5-8 counties
Each needs its own scraper:
- **Miami-Dade** — `onlineservices.miamidadeclerk.gov` (BUT has API at $0.20/unit and FTP at $420/mo)
- **Hillsborough** — `publicaccess.hillsclerk.com/oripublicaccess/`
- **Orange** — `selfservice.or.occompt.com` + `or.occompt.com/recorder/web/` (EagleRecorder)
- **Duval** — `or.duvalclerk.com` (OnCore)
- **Pinellas** — `officialrecords.mypinellasclerk.gov`
- **Volusia** — `app02.clerk.org/or_m/`
- **Sarasota** — `secure.sarasotaclerk.com` (ClerkNet 3.0)
- **Polk/Marion** — `apps.polkcountyclerk.net/browserviewor/` (BrowserView)

### Priority 5: One-Off Platforms — 3-5 counties
- **Seminole** — DuProcess (`recording.seminoleclerk.org`)
- **Collier** — Image One COR (`app.collierclerk.com/CORPublicAccess/`)
- **Okaloosa** — ClerkQuest (`clerkapps.okaloosaclerk.com/ClerkQuest/`)
- **Osceola** — searchng (`officialrecords.osceolaclerk.org/searchng_ssl/`)

---

## BULK DATA ACCESS SUMMARY

| County | Type | Cost | Details |
|--------|------|------|---------|
| **Broward** | SFTP | **FREE** | 10 days images + index. Records from 1978+. |
| **Miami-Dade** | FTP + API | $420/mo (FTP) + $0.20/API call | Register at www2.miamidadeclerk.gov/developers |
| **Palm Beach** | FTP | $600/year | Index only (no images). |
| **Hillsborough** | CSV downloads | Free | Court case data, monthly files. |

---

## KEY FINDINGS

1. **Landmark Web dominates mid-size counties.** Pioneer Technology Group (Sanford, FL) is the most common platform. One scraper covers ~15 counties including Palm Beach (#3 by pop).

2. **AcclaimWeb is the second most common.** Harris/Hyland platform. Broward's free SFTP is the single best bulk data source in FL. One scraper covers 6 counties.

3. **MyFloridaCounty ORI covers all small counties.** CiviTek/NIC state portal. One scraper with county ID parameter covers 20+ counties instantly.

4. **The big 5 are all custom.** Miami-Dade, Hillsborough, Orange, Duval, and Pinellas each have unique platforms. Miami-Dade is the only one with a commercial API.

5. **Three scrapers cover ~45 of 67 counties** (Landmark + AcclaimWeb + MyFloridaCounty ORI). The remaining ~22 require individual attention but include many of the largest counties.

6. **CLERICUS is a court CASE system, not official records.** 36 counties use it for case management, but official records search is separate.

7. **Orange County is split.** The Comptroller handles official records (EagleRecorder), the Clerk handles court records (myeClerk). Unique in FL.
