import React from 'react';
import {Composition} from 'remotion';
import {LeastInterest} from './LeastInterest';
import {W, H, FPS} from './theme';
export const Root: React.FC = () => (<Composition id="LeastInterest" component={LeastInterest} width={W} height={H} fps={FPS} durationInFrames={1050} />);
