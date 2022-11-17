##Deploy server process
local 
git add .
git commit -m "msg"
git push -u origin "target remote branch"

server
git pull origin "target remote branch"
npm run "target server" (see scripts int package.json file)
pm2 restart pm2_"target server file" (ex pm2_production.json)