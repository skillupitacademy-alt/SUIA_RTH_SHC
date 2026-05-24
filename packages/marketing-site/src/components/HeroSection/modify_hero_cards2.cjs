const fs = require('fs');
const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/components/HeroSection/HeroSlider.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace renderFixedCards with renderSquareCards
const renderFixedCardsRegex = /const renderFixedCards = \([\s\S]*?\}\);\s*\n\s*\};\s*\n/m;
const renderSquareCardsCode = `  const renderSquareCards = () => {
    return (
      <div className="hidden md:grid grid-cols-2 gap-4">
        {currentSlide.floatingIcons.map((item, idx) => {
          const Icon = ICON_MAP[item.icon];
          if (!Icon) return null;
          return (
            <div
              key={\`\${current}-\${idx}\`}
              className="flex flex-col items-center justify-center gap-3 w-28 h-28 rounded-2xl bg-white border border-gray-100 shadow-md transition-transform hover:scale-105"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: \`color-mix(in srgb, \${activeColor} 12%, white)\` }}
              >
                <Icon style={{ color: activeColor, width: 24, height: 24 }} />
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center px-1">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
`;
content = content.replace(renderFixedCardsRegex, renderSquareCardsCode);

// 2. Update Desktop section layout to remove the left cards and put the new ones on the right
const desktopSectionRegex = /\{\/\* Desktop \*\/\}\s*<div className="hidden md:flex relative h-full items-center justify-between px-12 lg:px-24">\s*<div className="max-w-2xl z-10 flex flex-col justify-center">\s*\{startSlider && renderFixedCards\(0, 3, false\)\}\s*<HeroText index=\{current\} \/>\s*\{startSlider && renderBadge\(\)\}\s*\{renderButtons\(\)\}\s*<\/div>\s*<div className="w-1\/2 h-full flex items-center justify-end gap-8">\s*\{startSlider && renderDesktopImage\(\)\}\s*\{startSlider && renderFixedCards\(3, 6, true\)\}\s*<\/div>\s*<\/div>/m;

const newDesktopSection = `{/* Desktop */}
      <div className="hidden md:flex relative h-full items-center justify-between px-12 lg:px-24">
        <div className="max-w-2xl z-10 flex flex-col justify-center">
          <HeroText index={current} />
          {startSlider && renderBadge()}
          {renderButtons()}
        </div>

        <div className="w-1/2 h-full flex items-center justify-end gap-8">
          {startSlider && renderDesktopImage()}
          {startSlider && renderSquareCards()}
        </div>
      </div>`;

content = content.replace(desktopSectionRegex, newDesktopSection);

fs.writeFileSync(path, content, 'utf8');
console.log('Modified HeroSlider successfully to square cards');
