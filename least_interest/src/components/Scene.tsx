// Scene shell: canvas set + camera (push-in, handheld drift, punches, shake) + motion-blurred character layer.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {CanvasLayer} from './Assets';
import {drift} from './rig';
import {W, H, C} from '../theme';

export type Cam = {z?: number; x?: number; y?: number; r?: number};
type Props = {
  dur: number;
  set: (t: number) => void;
  Layer?: React.FC;          // characters + world props (rendered with motion blur)
  world?: React.ReactNode;   // world-space UI that moves with the camera (tags, bubbles, phones)
  cam?: (f: number) => Cam;  // extra camera on top of the default slow push-in
  blur?: boolean;
  hand?: number;             // handheld amount
  children?: React.ReactNode; // screen-space text (eyebrows, headlines)
};
const SvgLayer: React.FC<{Layer: React.FC}> = ({Layer}) => (<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}><Layer /></svg>);
export const Scene: React.FC<Props> = ({dur, set, Layer, world, cam, blur = true, hand = 1, children}) => {
  const f = useCurrentFrame();
  const c = cam ? cam(f) : {};
  const z = interpolate(f, [0, dur], [1, 1.04]) * (c.z ?? 1);
  const x = (c.x ?? 0) + drift(f, 1) * 4 * hand, y = (c.y ?? 0) + drift(f, 3) * 3 * hand, r = (c.r ?? 0) + drift(f, 5) * 0.15 * hand;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{transform: `translate(${x}px,${y}px) scale(${z}) rotate(${r}deg)`, transformOrigin: '50% 58%'}}>
        <CanvasLayer draw={set} />
        {Layer && (blur ? <CameraMotionBlur samples={7} shutterAngle={200}><SvgLayer Layer={Layer} /></CameraMotionBlur> : <SvgLayer Layer={Layer} />)}
        {world}
      </AbsoluteFill>
      {children}
    </AbsoluteFill>
  );
};
