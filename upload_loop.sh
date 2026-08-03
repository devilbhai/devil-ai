#!/bin/bash
for file in /Users/gunjan/Documents/devil-ai/apps/desktop/release/Devil-ai-1.7.0-*.deb \
            /Users/gunjan/Documents/devil-ai/apps/desktop/release/Devil-ai-1.7.0-*.AppImage \
            /Users/gunjan/Documents/devil-ai/apps/desktop/release/Devil-ai-1.7.0-*.pkg \
            /Users/gunjan/Documents/devil-ai/apps/desktop/release/Devil-ai-1.7.0-*.exe \
            /Users/gunjan/Documents/devil-ai/apps/desktop/release/latest* \
            /Users/gunjan/Documents/devil-ai/apps/desktop/release/*.yml \
            /Users/gunjan/Documents/devil-ai/apps/desktop/release/*.blockmap; do
  if [[ -f "$file" ]]; then
    echo "Uploading $file..."
    while ! rsync --partial --append --bwlimit=2000 -e "ssh -o ServerAliveInterval=15 -o IPQoS=cs0 -o StrictHostKeyChecking=no -i ~/.ssh/rootdevil_ed25519" "$file" root@168.220.248.133:/home/agribee/server.agribee.in/devil-ai/; do
      echo "Upload dropped for $file, retrying to resume..."
      sleep 2
    done
  fi
done
echo "All files uploaded successfully."
