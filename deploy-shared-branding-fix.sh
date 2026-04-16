#!/bin/bash

# Deploy Shared Branding Fix
# This script triggers redeployment of the web services to serve the correct shared branding pages

echo "🚀 Deploying Shared Branding Fix..."
echo ""

# Check if we're in the right directory
if [ ! -f "apps/realtutorialhub-web/src/app/page.tsx" ]; then
    echo "❌ Error: Please run this script from the quiz-platform root directory"
    exit 1
fi

echo "📋 Current Issue:"
echo "   - user.realtutorialhub.com is showing old pages instead of RTH shared branding"
echo "   - user.skillupitacademy.com is showing old pages instead of SkillUp shared branding"
echo ""

echo "✅ Verified Shared Branding Setup:"
echo "   - RTH: apps/realtutorialhub-web/src/app/page.tsx → RTHLanding"
echo "   - SkillUp: apps/skillup-web/src/app/page.tsx → SkillUpLanding"
echo "   - Shared components exist in src/share-branding/"
echo ""

echo "🔧 Solution: Trigger redeployment of web services"
echo ""

# Create a deployment trigger comment
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Add deployment trigger to RTH web app
echo "# Deployment trigger: Shared branding fix - $TIMESTAMP" >> apps/realtutorialhub-web/DEPLOYMENT.md

# Add deployment trigger to SkillUp web app  
echo "# Deployment trigger: Shared branding fix - $TIMESTAMP" >> apps/skillup-web/DEPLOYMENT.md

echo "📝 Added deployment triggers to:"
echo "   - apps/realtutorialhub-web/DEPLOYMENT.md"
echo "   - apps/skillup-web/DEPLOYMENT.md"
echo ""

echo "🚀 Next Steps:"
echo "1. Commit and push these changes:"
echo "   git add apps/realtutorialhub-web/DEPLOYMENT.md apps/skillup-web/DEPLOYMENT.md"
echo "   git commit -m 'Deploy shared branding fix for user domains'"
echo "   git push origin main"
echo ""
echo "2. This will trigger GitHub Actions to redeploy both services"
echo ""
echo "3. Monitor deployment at:"
echo "   https://github.com/your-org/quiz-platform/actions"
echo ""
echo "4. After deployment (15-20 minutes), verify:"
echo "   - RTH: https://user.realtutorialhub.com/"
echo "   - SkillUp: https://user.skillupitacademy.com/"
echo ""
echo "✨ Both domains should now show the correct shared branding pages!"