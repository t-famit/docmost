#!/bin/bash
osascript -e 'tell application "Terminal"
  do script "cd ~/projects/docmost-dev && ./dev.sh"
  activate
end tell'