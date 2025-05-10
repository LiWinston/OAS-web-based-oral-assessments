# 🔧 Deployment Instructions for 90017 Backend
## 🚀 1. Trigger Deployment

To deploy the backend application, open the following URL in your browser:

http://45.113.232.163:8080/job/90017/build?token=90017

yaml
Copy
Edit

This will trigger a Jenkins job that automatically builds and deploys the project.
---

## ✅ 2. Check Last Deployment Time

To verify whether the deployment was successful, visit:

http://45.113.232.163:8081/deploy-time

If the returned deployment time has been updated, it indicates the deployment was successful.
---

## 🧪 3. If Deployment Fails

If the deployment fails, follow these steps:

1. **Build the project locally** to ensure it compiles correctly:

   For Maven:
   ```bash
   mvn clean package

Fix any compilation or configuration errors in your code or build process.

2. Update the production database if needed: Apply any schema or data changes.

3. Contact Me In Wechat: 🔍