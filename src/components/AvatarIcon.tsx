/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Crown,
  Cat,
  Trophy,
  Flame,
  Sparkles,
  Swords,
  Shield,
  Zap,
  Bot,
  Gem,
  CircleDot
} from 'lucide-react';

interface AvatarIconProps {
  name?: string;
  avatarKey?: string;
  className?: string;
  size?: number;
}

export const AvatarIcon: React.FC<AvatarIconProps> = ({ name, avatarKey, className = 'w-5 h-5', size }) => {
  const iconProps = { className, size };
  const key = name || avatarKey || 'circle';

  switch (key) {
    case 'crown':
      return <Crown {...iconProps} />;
    case 'tiger':
      return <Cat {...iconProps} />;
    case 'trophy':
      return <Trophy {...iconProps} />;
    case 'flame':
      return <Flame {...iconProps} />;
    case 'star':
      return <Sparkles {...iconProps} />;
    case 'sword':
      return <Swords {...iconProps} />;
    case 'shield':
      return <Shield {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    case 'robot':
      return <Bot {...iconProps} />;
    case 'diamond':
      return <Gem {...iconProps} />;
    default:
      return <CircleDot {...iconProps} />;
  }
};
