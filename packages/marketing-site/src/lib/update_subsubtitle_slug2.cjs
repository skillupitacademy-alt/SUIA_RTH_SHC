const fs = require('fs');

const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/CoursesCardData.ts';
let content = fs.readFileSync(path, 'utf8');

const courseToDesc = {
  "data-analyst": "Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects.",
  "data-science-ai-bootcamp": "Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects.",
  "full-stack-java": "Covering Java, Spring Boot, REST APIs, Microservices, Database Management, Frontend Development, AI Integration, Cloud Deployment, and Real-World Full Stack AI Application Projects.",
  "python-programming": "Covering Python, Django, FastAPI, REST APIs, Database Management, Frontend Development, AI Integration, Machine Learning, Cloud Deployment, and Real-World Full Stack AI Application Projects.",
  "full-stack-php": "Covering PHP, Laravel, MySQL, REST APIs, Frontend Development, Cloud Deployment, and Real-World Full Stack Application Projects.",
  "full-stack-mern": "Covering MongoDB, Express.js, React, Node.js, REST APIs, AI Integration, Cloud Deployment, Scalable Architecture, and Real-World Full Stack AI Application Projects.",
  "full-stack-mean": "Covering MongoDB, Express.js, Angular, Node.js, REST APIs, AI Integration, Cloud Deployment, Enterprise Architecture, and Real-World Full Stack AI Application Projects.",
  "frontend-development": "Covering HTML, CSS, JavaScript, React, Responsive Design, UI/UX Principles, Performance Optimization, and Real-World Frontend Application Projects.",
  "backend-development": "Covering Server-Side Development, REST APIs, Authentication, Database Management, Microservices, Cloud Deployment, Security Best Practices, and Real-World Backend Application Projects.",
  "full-stack-dotnet": "Covering C#, ASP.NET Core, REST APIs, Microservices, SQL Server, Frontend Development, AI Integration, Cloud Deployment, Enterprise Architecture, and Real-World Full Stack AI Application Projects.",
  "cybersecurity-professional": "Covering Network Security, Cryptography, Penetration Testing, Cloud Security, Incident Response, and Real-World Cybersecurity Application Projects.",
  "ethical-hacking-expert": "Covering Network Security, Cryptography, Penetration Testing, Cloud Security, Incident Response, and Real-World Cybersecurity Application Projects.",
  "data-engineering": "Covering Cloud Infrastructure, Continuous Integration, Continuous Deployment, Infrastructure as Code, and Real-World DevOps Application Projects.",
  "algorithmic-trading": "Covering Algorithmic Trading, Quantitative Analysis, Financial Modeling, Machine Learning in Finance, and Real-World Trading Application Projects.",
  "devops-engineering": "Covering Cloud Infrastructure, Continuous Integration, Continuous Deployment, Infrastructure as Code, and Real-World DevOps Application Projects.",
  "machine-learning-specialist": "Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects."
};

for (const slug in courseToDesc) {
  const desc = courseToDesc[slug];
  
  // Find the index of the slug
  let slugIndex = content.indexOf('slug: "' + slug + '"');
  if (slugIndex === -1) {
    slugIndex = content.indexOf("slug: '" + slug + "'");
  }
  
  if (slugIndex !== -1) {
    // Find the next occurrence of subSubtitle: after this slug
    const subSubtitleIndex = content.indexOf('subSubtitle:', slugIndex);
    if (subSubtitleIndex !== -1) {
      // Find the end of the line
      const endOfLine = content.indexOf('\\n', subSubtitleIndex);
      
      const before = content.substring(0, subSubtitleIndex);
      const after = content.substring(endOfLine);
      
      content = before + 'subSubtitle: "' + desc + '",' + after;
    }
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log("Replaced subSubtitles using slugs.");
