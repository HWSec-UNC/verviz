# Use Ubuntu as the base image
FROM ubuntu:22.04

# Set up working directory
WORKDIR /workspace

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    python3 \
    python3-pip \
    jq \
    && apt-get clean

# Install Node.js 22 and npm
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Install OKD CLI
RUN wget -O /tmp/oc.tgz "https://github.com/okd-project/okd/releases/download/4.15.0-0.okd-2024-03-10-010116/openshift-client-linux-4.15.0-0.okd-2024-03-10-010116.tar.gz" \
    && tar -xvzf /tmp/oc.tgz -C /usr/local/bin \
    && rm /tmp/oc.tgz

# Verify installations
RUN node -v && npm -v && python3 --version && oc version

# Default to bash shell
CMD ["/bin/bash"]


