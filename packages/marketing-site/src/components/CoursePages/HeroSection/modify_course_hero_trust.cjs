const fs = require('fs');

const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/components/CoursePages/HeroSection/MainHeroSection.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{\/\* Trust Indicators \*\/\}([\s\S]*?)<\/div>\s*\)\}\s*<\/div>\s*<\/div>/m;
const replacement = `{/* Trust Indicators */}
        {companies.length > 0 && (
          <div className="mt-16 text-center">
            <p className="opacity-80 text-sm font-medium mb-4 uppercase tracking-wider">
              <span style={{ color: "var(--brand-primary)" }}>Trusted by </span>
              <span style={{ color: "var(--brand-secondary)" }}>students from</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {companies.map((company, idx) => {
                const isPrimary = idx % 2 === 0;
                return (
                  <div
                    key={idx}
                    className="px-6 py-3 bg-white shadow-md rounded-xl border transition-all duration-300 hover:scale-105"
                    style={{
                      borderColor: isPrimary ? "color-mix(in srgb, var(--brand-primary) 30%, transparent)" : "color-mix(in srgb, var(--brand-secondary) 30%, transparent)"
                    }}
                  >
                    <span 
                      className="font-semibold text-lg"
                      style={{ color: isPrimary ? "var(--brand-primary)" : "var(--brand-secondary)" }}
                    >
                      {company}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>`;

content = content.replace(regex, replacement);

fs.writeFileSync(path, content, 'utf8');
console.log('Trust Indicators replaced successfully.');
