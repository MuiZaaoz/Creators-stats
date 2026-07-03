import React from 'react';
import { platformColor, platformInitial } from '../lib/utils';

export default function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="platform-icon" style={{ background: platformColor(platform) }}>
      {platformInitial(platform)}
    </span>
  );
}
