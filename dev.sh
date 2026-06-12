#!/bin/bash
SESSION="docmost-dev"

tmux has-session -t $SESSION 2>/dev/null

if [ $? != 0 ]; then
  tmux new-session -d -s $SESSION -n "server"
  tmux send-keys -t $SESSION "cd ~/projects/docmost-dev && pnpm nx run server:start:dev" Enter
  tmux split-window -h -t $SESSION
  tmux send-keys -t $SESSION "cd ~/projects/docmost-dev && pnpm nx run client:dev" Enter
fi

tmux attach -t $SESSION