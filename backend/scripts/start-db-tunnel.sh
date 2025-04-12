#!/bin/bash

SSH_USER=ubuntu
SSH_HOST=oas12025.eng.unimelb.edu.au
REMOTE_PORT=3306
LOCAL_PORT=3307

# ========== check if local port is already occupied ==========
function check_port {
  lsof -i tcp:$LOCAL_PORT | grep LISTEN > /dev/null
  return $?
}

echo " checking local port $LOCAL_PORT ..."
check_port

if [ $? -eq 0 ]; then
  echo " local port $LOCAL_PORT is already occupied, please check and kill the process"
  exit 1
else
  echo "start building ssh tunnel：local port $LOCAL_PORT → $SSH_HOST:$REMOTE_PORT..."
  ssh -fN -L $LOCAL_PORT:localhost:$REMOTE_PORT $SSH_USER@$SSH_HOST
  if [ $? -eq 0 ]; then
    echo "ssh tunnel is up and running, you can connect to the database using localhost:$LOCAL_PORT"
  else
    echo "failed to start ssh tunnel, please check your ssh config"
    exit 1
  fi
fi