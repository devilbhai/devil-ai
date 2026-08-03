#!/bin/bash
set -e

echo "Preparing chunks..."
mkdir -p /Users/gunjan/Documents/devil-ai/temp_upload_chunks
cd /Users/gunjan/Documents/devil-ai/temp_upload_chunks
rm -f chunk_* release_payload.tar

# Package the files, avoiding Mac extended metadata files (._) which break Linux tar
COPYFILE_DISABLE=1 tar -cvf release_payload.tar -C /Users/gunjan/Documents/devil-ai/apps/desktop/release \
  Devil-ai-1.8.0-linux-amd64.deb \
  Devil-ai-1.8.0-linux-x86_64.AppImage \
  Devil-ai-1.8.0-mac-arm64.pkg \
  Devil-ai-1.8.0-mac-x64.pkg \
  Devil-ai-1.8.0-win-x64.exe \
  Devil-ai-1.8.0-win-x64.exe.blockmap \
  latest-linux.yml \
  latest.yml

echo "Splitting into small 2MB chunks to bypass network corruption..."
split -b 2m release_payload.tar chunk_

echo "Uploading chunks to server..."
for chunk in chunk_*; do
  echo "Uploading $chunk..."
  # Use rsync with --append so even the 2MB chunk resumes if dropped!
  while ! rsync --partial --append -e "ssh -o ServerAliveInterval=15 -o IPQoS=cs0 -o StrictHostKeyChecking=no -i ~/.ssh/rootdevil_ed25519" "$chunk" root@168.220.248.133:/home/agribee/server.agribee.in/devil-ai/; do
    echo "Retrying $chunk..."
    sleep 1
  done
done

echo "Reassembling on server..."
ssh -o StrictHostKeyChecking=no -i ~/.ssh/rootdevil_ed25519 root@168.220.248.133 "cd /home/agribee/server.agribee.in/devil-ai/ && rm -f Devil-ai-1.7.0* && cat chunk_* > release_payload.tar && tar -xvf release_payload.tar && rm -f chunk_* release_payload.tar"

echo "Upload completely successful!"
