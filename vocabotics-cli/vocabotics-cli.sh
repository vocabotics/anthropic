#!/bin/bash
# Wrapper script to run vocabotics CLI
cd "$(dirname "$0")"
python3 -m vocabotics.cli "$@"
