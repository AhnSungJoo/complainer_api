#!/bin/bash

TARGET=dev3

# rm -rf deployment

echo "Creating deployment directory (and logs directory in deployment)"
# mkdir -p deployment

echo "------------------"
echo "Copying all necessary files to deployment"
# rsync -rlvx -P --exclude=config ./build/* ./deployment

echo "------------------"
echo "Copying config files for $TARGET"
# mkdir -p deployment/config
# cp ./build/config/$TARGET.json ./deployment/config

# cp package.json ./deployment
# cp package-lock.json ./deployment
# cp pm2_$TARGET.json ./deployment/pm2.json
# cp ./scripts/restart.sh ./deployment
# cp ./scripts/start.sh ./deployment
# cp ./scripts/stop.sh ./deployment
# cp ./scripts/setupEnv.sh ./deployment
# cp key.pem ./deployment/
# cp cert.pem ./deployment/


echo "------------------"
echo "Syncronizing deployment to the remote server $TARGET"
USERID=deploy
SERVER_IP=192.168.0.57
rsync -arlvz -P --delete ./dist/* -e ssh $USERID@$SERVER_IP:/home/deploy/project/cq_backer
