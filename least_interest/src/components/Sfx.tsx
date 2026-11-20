// Sound effect cue. Timing lives in code; if the file is missing from /public/sfx the cue is skipped silently.
import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {getStaticFiles} from '@remotion/studio';

let available: Set<string> | null = null;
const has = (name: string) => {
  if (!available) {try {available = new Set(getStaticFiles().map((f) => f.name));} catch {available = new Set();}}
  return available.has(`sfx/${name}`);
};
export const Sfx: React.FC<{name: string; at: number; volume?: number}> = ({name, at, volume = 0.6}) => {
  if (!has(name)) return null;
  return <Sequence from={at} layout="none"><Audio src={staticFile(`sfx/${name}`)} volume={volume} /></Sequence>;
};
