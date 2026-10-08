

import React from 'react';
import {
  ChevronRight,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Link as LinkIcon,
  Clock,
  CreditCard,
  Trophy,
  ArrowRight,
  MailOpen,
} from 'lucide-react';

interface IconProps {
  name:
    | 'chevron'
    | 'check'
    | 'location'
    | 'phone'
    | 'email'
    | 'link'
    | 'clock'
    | 'card'
    | 'trophy'
    | 'arrow'
    | 'envelope';
  className?: string;
}

const iconMap = {
  chevron: ChevronRight,
  check: CheckCircle,
  location: MapPin,
  phone: Phone,
  email: Mail,
  link: LinkIcon,
  clock: Clock,
  card: CreditCard,
  trophy: Trophy,
  arrow: ArrowRight,
  envelope: MailOpen,
};

const Icon: React.FC<IconProps> = ({
  name,
  className = 'w-4 h-4 text-current',
}) => {
  const IconComponent = iconMap[name];
  if (!IconComponent) return null;

  return <IconComponent className={className} />;
};

export default Icon;
