import React from 'react';
import {
  FaCode,
  FaPython,
  FaJs,
  FaDatabase,
  FaGitAlt,
  FaTerminal,
  FaDesktop,
  FaWifi,
  FaHdd,
  FaVideo,
  FaChrome,
  FaClock,
  FaCalendarAlt,
  FaUsers,
  FaBook,
  FaLaptopCode,
  FaStar,
  FaGraduationCap,
  FaChartLine,
  FaBriefcase
} from 'react-icons/fa';

export const reactIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  // Existing icons
  'FaStar': FaStar,
  'FaUsers': FaUsers,
  'FaGraduationCap': FaGraduationCap,
  'FaChartLine': FaChartLine,
  'FaCode': FaCode,
  'FaBriefcase': FaBriefcase,
  
  // New icons for prerequisites
  'FaPython': FaPython,
  'FaJs': FaJs,
  'FaDatabase': FaDatabase,
  'FaGitAlt': FaGitAlt,
  'FaTerminal': FaTerminal,
  'FaDesktop': FaDesktop,
  'FaWifi': FaWifi,
  'FaHdd': FaHdd,
  'FaVideo': FaVideo,
  'FaChrome': FaChrome,
  'FaClock': FaClock,
  'FaCalendarAlt': FaCalendarAlt,
  'FaBook': FaBook,
  'FaLaptopCode': FaLaptopCode
};

export const getReactIcon = (iconName: string): React.ComponentType<{ className?: string }> => {
  return reactIconMap[iconName] || FaCode;
};