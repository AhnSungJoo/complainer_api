##Deploy server process
local 
git add .
git commit -m "msg"
git push -u origin "target remote branch"

server
git pull origin "target remote branch"
npm run "target server" (see scripts int package.json file)
pm2 restart pm2_"target server file" (ex pm2_production.json)


## 서버 각 shell 특성 
sh deploy_server.sh 
=> 서버 배포용 명령 
=> git pull -> build -> server 

sh server_restart.sh 
=> 서버 재시작 용 

sh todaylog.sh 
=> 오늘 로그 tail 
=> tail -f logs/~