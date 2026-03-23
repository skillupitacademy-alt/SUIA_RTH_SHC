export default function manifest() {
  return {
    name: 'SkillUp IT Academy',
    short_name: 'SkillUp',
    description: 'Student portal for SkillUp IT Academy',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f6e56',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
