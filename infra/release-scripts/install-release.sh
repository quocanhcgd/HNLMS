#!/usr/bin/env bash
set -euo pipefail

usage() { echo "Usage: $0 <version> <artifact.tgz> <artifact.sha256>" >&2; exit 2; }
[[ $# -eq 3 ]] || usage
version="$1"; artifact="$(realpath "$2")"; checksum_file="$(realpath "$3")"
[[ "$version" =~ ^[A-Za-z0-9._-]+$ ]] || { echo "Unsafe version" >&2; exit 1; }
[[ -f "$artifact" && -f "$checksum_file" ]] || { echo "Artifact/checksum missing" >&2; exit 1; }
cd "$(dirname "$artifact")"; sha256sum -c "$checksum_file"
release_root=/opt/hn-lms/releases
target="$release_root/$version"
[[ "$target" == "$release_root/"* ]] || { echo "Unsafe release target" >&2; exit 1; }
[[ ! -e "$target" ]] || { echo "Release already exists: $target" >&2; exit 1; }
install -d -o hnlms -g hnlms -m 0755 "$target"
tar -xzf "$artifact" -C "$target"
cd "$target"; npm ci --omit=dev
chown -R hnlms:hnlms "$target"
echo "Installed immutable release at $target; run activate.sh explicitly"
