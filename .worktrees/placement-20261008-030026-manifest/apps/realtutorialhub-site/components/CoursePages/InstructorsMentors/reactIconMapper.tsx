import React from 'react';
import {
  FaStar,
  FaUsers,
  FaClock,
  FaGraduationCap,
  FaChartLine,
  FaCode,
  FaBriefcase
} from 'react-icons/fa';

export const reactIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'FaStar': FaStar,
  'FaUsers': FaUsers,
  'FaClock': FaClock,
  'FaGraduationCap': FaGraduationCap,
  'FaChartLine': FaChartLine,
  'FaCode': FaCode,
  'FaBriefcase': FaBriefcase
};

export const getReactIcon = (iconName: string): React.ComponentType<{ className?: string }> => {
  return reactIconMap[iconName] || FaStar;
};