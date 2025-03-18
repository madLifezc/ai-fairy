#!/bin/bash

# 查找 "server/main.py" 进程的 PID
PID=$(ps aux | grep "server/main.py" | grep -v grep | awk '{print $2}')

# 检查是否找到进程
if [ -z "$PID" ]; then
  echo "未找到 server/main.py 进程。"
else
  echo "找到 server/main.py 进程，PID: $PID"
  
  # 关闭进程
  kill -9 $PID
  
  # 检查是否成功关闭
  if [ $? -eq 0 ]; then
    echo "进程 $PID 已成功关闭。"
  else
    echo "无法关闭进程 $PID。"
  fi
fi

echo '启动aiStory...'
nohup python server/main.py > info.log & 
echo '启动完成...'
