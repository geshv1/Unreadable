// Hand props drawn at a joint.
import React from 'react';
import {C} from '../theme';
export const PhoneProp: React.FC<{p: number[]; glow?: number; rot?: number}> = ({p, glow = 1, rot = -20}) => (
  <g transform={`translate(${p[0]},${p[1] - 14}) rotate(${rot})`}>
    {glow > 0 && <circle r={70} fill="url(#phoneGlow)" opacity={glow} />}
    <rect x={-12} y={-22} width={24} height={42} rx={6} fill="#0a0a0c" /><rect x={-9} y={-19} width={18} height={36} rx={4} fill="#c9d6ff" opacity={0.25 + 0.75 * glow} />
  </g>);
export const GlowDefs: React.FC = () => (<defs><radialGradient id="phoneGlow"><stop offset="0" stopColor="rgba(170,195,255,.45)" /><stop offset="1" stopColor="rgba(170,195,255,0)" /></radialGradient></defs>);
export const Dumbbell: React.FC<{p: number[]; rot?: number}> = ({p, rot = 0}) => (
  <g transform={`translate(${p[0]},${p[1]}) rotate(${rot})`}><rect x={-26} y={-4} width={52} height={8} fill="#0a0a0c" /><rect x={-36} y={-15} width={14} height={30} rx={4} fill="#0a0a0c" /><rect x={22} y={-15} width={14} height={30} rx={4} fill="#0a0a0c" /><rect x={-33} y={-12} width={8} height={24} rx={3} fill="#3a3b42" /><rect x={25} y={-12} width={8} height={24} rx={3} fill="#3a3b42" /></g>);
export const Can: React.FC<{p: number[]; rot?: number}> = ({p, rot = 0}) => (
  <g transform={`translate(${p[0]},${p[1] - 12}) rotate(${rot})`}><rect x={-11} y={-20} width={22} height={38} rx={5} fill="#0a0a0c" /><rect x={-8} y={-17} width={16} height={32} rx={3} fill={C.red} /><rect x={-8} y={-6} width={16} height={6} fill="#111" /></g>);
export const Bottle: React.FC<{p: number[]; rot?: number}> = ({p, rot = 0}) => (
  <g transform={`translate(${p[0]},${p[1] - 16}) rotate(${rot})`}><rect x={-10} y={-26} width={20} height={44} rx={6} fill="rgba(200,225,255,.35)" stroke="#e8f1ff" strokeWidth={3} /><rect x={-5} y={-34} width={10} height={8} rx={2} fill="#e8f1ff" /></g>);
export const Glass: React.FC<{p: number[]; rot?: number}> = ({p, rot = 0}) => (
  <g transform={`translate(${p[0]},${p[1] - 14}) rotate(${rot})`}><path d="M-11 -18 L11 -18 L8 16 L-8 16 Z" fill="rgba(230,170,60,.75)" stroke="#0a0a0c" strokeWidth={3} /><rect x={-11} y={-18} width={22} height={6} fill="rgba(255,250,235,.8)" /></g>);
export const Keys: React.FC<{p: number[]; swing: number}> = ({p, swing}) => (
  <g transform={`translate(${p[0]},${p[1] + 6}) rotate(${swing})`}><circle cy={4} r={7} fill="none" stroke="#c9ccd4" strokeWidth={3} /><rect x={-3} y={10} width={6} height={22} rx={2} fill="#c9ccd4" /><rect x={-10} y={10} width={9} height={14} rx={2} fill="#111" stroke="#c9ccd4" strokeWidth={2} /></g>);
