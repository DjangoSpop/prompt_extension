# 🚀 QUICK START GUIDE
## دليل البدء السريع

**Time to deploy: 30 minutes** ⏱️

---

## Step 1: Prepare Your Server (5 mins)

### ✅ Requirements Check
- [ ] HostGator Shared Hosting active
- [ ] cPanel access credentials
- [ ] Domain pointed to hosting
- [ ] SSL certificate installed

### Access cPanel
```
URL: https://yourdomain.com/cpanel
Username: [your_cpanel_user]
Password: [your_cpanel_password]
```

---

## Step 2: Create MySQL Database (3 mins)

### In cPanel → MySQL® Databases:

1. **Create Database**
   ```
   Database Name: realstate_db
   ```

2. **Create User**
   ```
   Username: realstate_user
   Password: [generate strong password]
   ```

3. **Add User to Database**
   ```
   User: realstate_user
   Database: realstate_db
   Privileges: ALL PRIVILEGES
   ```

4. **Save Credentials**
   ```
   Host: localhost
   Database: realstate_db
   User: realstate_user
   Password: [your_password]
   ```

---

## Step 3: Install WordPress (10 mins)

### Option A: Softaculous (Easiest)
```
cPanel → Softaculous → WordPress → Install
- Choose domain
- Site Name: سوق العقارات
- Admin Username: admin
- Admin Password: [strong password]
- Admin Email: your@email.com
- Language: العربية
Install!
```

### Option B: Manual
```
1. Download WordPress from wordpress.org
2. Upload via cPanel File Manager to public_html
3. Visit: https://yourdomain.com/wp-admin/install.php
4. Enter database details from Step 2
5. Complete installation
```

---

## Step 4: Upload Plugin & Theme (5 mins)

### A. Via WordPress Dashboard (Recommended)

1. **Login to WordPress**
   ```
   URL: https://yourdomain.com/wp-admin
   ```

2. **Install Astra Theme**
   ```
   Appearance → Themes → Add New
   Search: "Astra"
   Install & Activate
   ```

3. **Upload RealState Plugin**
   ```
   Plugins → Add New → Upload Plugin
   Choose: realstate-core.zip
   Install Now → Activate
   ```

4. **Upload Child Theme**
   ```
   Appearance → Themes → Add New → Upload Theme
   Choose: astra-child.zip
   Install → Activate
   ```

### B. Via cPanel File Manager

```
1. Go to: cPanel → File Manager
2. Navigate to: public_html/wp-content/plugins/
3. Upload & Extract: realstate-core.zip
4. Navigate to: public_html/wp-content/themes/
5. Upload & Extract: astra-child.zip
6. Activate both in WordPress dashboard
```

---

## Step 5: Import Database Schema (3 mins)

### Via phpMyAdmin:

```
1. cPanel → phpMyAdmin
2. Select database: realstate_db
3. Click: Import tab
4. Choose file: realstate_schema.sql
5. Click: Go
6. Wait for success message
```

---

## Step 6: Configure Permalinks (1 min)

```
WordPress Dashboard:
Settings → Permalinks
→ Select: "Post name"
→ Save Changes
```

---

## Step 7: Setup Cron Job (2 mins)

### In cPanel → Cron Jobs:

```
Add New Cron Job:
- Minute: */10
- Hour: *
- Day: *
- Month: *
- Weekday: *

Command:
wget -q -O - https://yourdomain.com/wp-cron.php?doing_wp_cron=1 >/dev/null 2>&1
```

---

## Step 8: Create Essential Pages (3 mins)

### A. Homepage

```
Pages → Add New
Title: الرئيسية
Content:
[realstate_search show_filters="yes"]
[realstate_featured limit="8"]

Settings → Reading → Set as homepage
```

### B. Property Archive

```
Pages → Add New
Title: العقارات
Content:
[realstate_search]
```

### C. Agents Directory

```
Pages → Add New
Title: الوكلاء
Content:
[realstate_agents limit="12"]
```

### D. Submit Property

```
Pages → Add New
Title: إضافة عقار
Content:
[realstate_submit]
```

---

## Step 9: Configure RealState Settings (2 mins)

```
Dashboard → RealState → Settings

Basic Settings:
- Default Currency: EGP
- Items Per Page: 12
- Map Provider: Static
- Phone Masking: ✓ Enabled

Save Settings
```

---

## Step 10: Test Everything (3 mins)

### ✅ Test Checklist:

- [ ] Visit homepage
- [ ] Search for properties
- [ ] View property details
- [ ] Submit inquiry form
- [ ] View agents directory
- [ ] Mobile responsive check
- [ ] RTL layout check

---

## 🎉 You're Live!

### Next Steps:

1. **Add Sample Data**
   ```
   Import: db/seed.sql (optional)
   Or manually add 5-10 properties
   ```

2. **Create Admin User Roles**
   ```
   Users → Add New
   Role: Agent Basic / Agent Pro
   ```

3. **Configure Monetization**
   ```
   RealState → Monetization
   Set your pricing plans
   ```

4. **Setup Legal Pages**
   ```
   Use templates in: docs/LEGAL_TEMPLATES.md
   Create: Privacy Policy, Terms of Service
   ```

5. **Enable SSL (if not done)**
   ```
   cPanel → SSL/TLS Status
   Run AutoSSL
   ```

---

## 🆘 Troubleshooting

### Site shows errors?
```
1. Enable WP_DEBUG in wp-config.php
2. Check error logs in cPanel
3. Ensure PHP version is 8.0+
```

### Plugin won't activate?
```
1. Check file permissions (755 for folders, 644 for files)
2. Increase PHP memory: define('WP_MEMORY_LIMIT', '256M');
3. Check error logs
```

### Permalinks not working?
```
1. Check .htaccess file exists
2. Ensure mod_rewrite is enabled
3. Reset permalinks: Settings → Permalinks → Save
```

### Images not uploading?
```
1. Check uploads folder permissions
2. Increase upload size in php.ini or .htaccess:
   php_value upload_max_filesize 20M
   php_value post_max_size 20M
```

---

## 📞 Need Help?

**📖 Full Documentation**: See `/docs/` folder
**🔧 Technical Issues**: Check DEPLOYMENT_SHARED.md
**💼 Daily Operations**: See ADMIN_OPERATIONS.md
**🧪 Testing**: See QA_CHECKLIST.md

---

## 🎯 Success Metrics

After 1 week, you should have:
- ✅ 10+ properties listed
- ✅ 2+ agents registered
- ✅ Search analytics collecting
- ✅ First inquiry submitted
- ✅ Mobile traffic working

---

**تهانينا! موقعك جاهز | Congratulations! Your site is ready!** 🎊

Visit: https://yourdomain.com

Admin: https://yourdomain.com/wp-admin
