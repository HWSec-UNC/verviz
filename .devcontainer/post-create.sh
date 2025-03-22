#!/bin/bash

echo "Starting post-create setup..."

apt-get remove -y nodejs

# Install OKD CLI (if not installed properly in Dockerfile)
arch="$(arch)"
case "$arch" in 
    x86_64) export TARGET='' ;; 
    aarch64) export TARGET='arm64-' ;; 
esac
wget -O /tmp/oc.tgz "https://github.com/okd-project/okd/releases/download/4.15.0-0.okd-2024-03-10-010116/openshift-client-linux-${TARGET}4.15.0-0.okd-2024-03-10-010116.tar.gz"
pushd /tmp
tar -xvzf oc.tgz
mv oc /usr/local/bin/oc
rm kubectl oc.tgz README.md
popd

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Install global npm dependencies
npm install -g npm

# Verify installations
oc version
node -v
npm -v

echo "Dev container setup complete!"
