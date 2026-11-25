#!/usr/bin/env python3
"""Make a TWO MEN episode:  .venv/bin/python make.py episodes/ep01_insult.json"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from engine.render import make  # noqa: E402

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Render a TWO MEN episode from its JSON config.")
    ap.add_argument("configs", nargs="+", help="episode JSON file(s), e.g. episodes/ep01_insult.json")
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 4)
    a = ap.parse_args()
    failed = False
    for c in a.configs:
        _, rep = make(c, workers=a.workers)
        failed |= any("FAIL" in r for r in rep)
    sys.exit(1 if failed else 0)
