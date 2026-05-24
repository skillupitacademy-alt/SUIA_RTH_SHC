const fs = require('fs');
const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/components/HeroSection/HeroSlider.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace renderFloatingIcons with renderFixedCards
const renderFloatingIconsRegex = /const renderFloatingIcons = \(\) =>[\s\S]*?\}\);\s*\n/m;
const renderFixedCardsCode = `  const renderFixedCards = (start: number, end: number, isVertical: boolean = false) => {
    return (
      <div className={\`hidden md:flex \${isVertical ? 'flex-col' : 'flex-row'} gap-4 \${!isVertical ? 'mb-6' : ''}\`}>
        {currentSlide.floatingIcons.slice(start, end).map((item, idx) => {
          const Icon = ICON_MAP[item.icon];
          if (!Icon) return null;
          return (
            <div
              key={\`\${current}-\${start}-\${idx}\`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-md transition-transform hover:scale-105"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: \`color-mix(in srgb, \${activeColor} 12%, white)\` }}
              >
                <Icon style={{ color: activeColor, width: 18, height: 18 }} />
              </div>
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
`;
content = content.replace(renderFloatingIconsRegex, renderFixedCardsCode);

// 2. Remove old floating icons call and keyframe
const oldFloatingCallRegex = /\{\/\* Floating Icons \*\/\}\s*\{startSlider && renderFloatingIcons\(\)\}\s*\{\/\* Float keyframe \*\/\}\s*<style>\{`[\s\S]*?`\}<\/style>/m;
content = content.replace(oldFloatingCallRegex, '');

// 3. Update Desktop section layout
const desktopSectionRegex = /\{\/\* Desktop \*\/\}\s*<div className="hidden md:flex relative h-full items-center justify-between px-12 lg:px-24">\s*<div className="max-w-2xl z-10">\s*<HeroText index=\{current\} \/>\s*\{startSlider && renderBadge\(\)\}\s*\{renderButtons\(\)\}\s*<\/div>\s*<div className="w-1\/2 h-full flex items-center justify-end">\s*\{startSlider && renderDesktopImage\(\)\}\s*<\/div>\s*<\/div>/m;

const newDesktopSection = `{/* Desktop */}
      <div className="hidden md:flex relative h-full items-center justify-between px-12 lg:px-24">
        <div className="max-w-2xl z-10 flex flex-col justify-center">
          {startSlider && renderFixedCards(0, 3, false)}
          <HeroText index={current} />
          {startSlider && renderBadge()}
          {renderButtons()}
        </div>

        <div className="w-1/2 h-full flex items-center justify-end gap-8">
          {startSlider && renderDesktopImage()}
          {startSlider && renderFixedCards(3, 6, true)}
        </div>
      </div>`;

content = content.replace(desktopSectionRegex, newDesktopSection);

fs.writeFileSync(path, content, 'utf8');
console.log('Modified HeroSlider successfully');
