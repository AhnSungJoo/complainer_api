# local push
git add .
git commit -m "commit comment"
git push -u origin main

# server pull
git pull origin main
nodemon
pm2 restart pm2_production.json
