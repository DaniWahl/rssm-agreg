**Aktienregister Schulgebäude RSSM**

Datenbank und Applikation zur Verwaltung des Aktienregisters der AG Schulgebäude RSSM. 


**Installation**
1. clone from Github 
2. npm install 
3. npm run postinstall

**Build & load the database:**
1. make sure database path is set correctly in _bin/db_create.js_ and _bin/db_import_data.js_
2. make sure workbook path is set correctly in _bin/db_import_data.js_
3. run `npm db_create`
4. run `npm db_import`

**Note:** typically, the database is located in _./db/_ and the import doc in _./docs/_

