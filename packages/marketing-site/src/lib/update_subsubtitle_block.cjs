const fs = require('fs');

const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/CoursesCardData.ts';
let content = fs.readFileSync(path, 'utf8');

const mapping = {
  "with AI & ML Integration": "Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects.",
  "with ML, Deep Learning & MLOps": "Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects.",
  "with AI Integration": "Covering Java, Spring Boot, REST APIs, Microservices, Database Management, Frontend Development, AI Integration, Cloud Deployment, and Real-World Full Stack AI Application Projects.",
  "with Big Data Technologies": "Covering PHP, Laravel, MySQL, REST APIs, Frontend Development, Cloud Deployment, and Real-World Full Stack Application Projects."
};

let resultStr = content;

// Since there are only a few unique old subSubtitles, let's just globally replace them
// But wait, "with AI Integration" is used by both Python and Java.
// Let's just use string replacement carefully.

// A foolproof way is to split the content by 'slug: ' and then do one replacement per block.
const blocks = content.split(/slug:\s*['"]/);

const courseToDesc = {
  "data-analyst": "Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects.",
  "data-science-ai-bootcamp": "Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects.",
  "full-stack-java": "Covering Java, Spring Boot, REST APIs, Microservices, Database Management, Frontend Development, AI Integration, Cloud Deployment, and Real-World Full Stack AI Application Projects.",
  "python-programming": "Covering Python, Django, FastAPI, REST APIs, Database Management, Frontend Development, AI Integration, Machine Learning, Cloud Deployment, and Real-World Full Stack AI Application Projects.",
  "full-stack-php": "Covering PHP, Laravel, MySQL, REST APIs, Frontend Development, Cloud Deployment, and Real-World Full Stack Application Projects.",
  "full-stack-mern": "Covering MongoDB, Express.js, React, Node.js, REST APIs, AI Integration, Cloud Deployment, Scalable Architecture, and Real-World Full Stack AI Application Projects.",
  "full-stack-mean": "Covering MongoDB, Express.js, Angular, Node.js, REST APIs, AI Integration, Cloud Deployment, Enterprise Architecture, and Real-World Full Stack AI Application Projects.",
  "cybersecurity-professional": "Covering Network Security, Cryptography, Penetration Testing, Cloud Security, Incident Response, and Real-World Cybersecurity Application Projects.",
  "ethical-hacking-expert": "Covering Network Security, Cryptography, Penetration Testing, Cloud Security, Incident Response, and Real-World Cybersecurity Application Projects.",
  "data-engineering": "Covering Cloud Infrastructure, Continuous Integration, Continuous Deployment, Infrastructure as Code, and Real-World DevOps Application Projects.",
  "algorithmic-trading": "Covering Algorithmic Trading, Quantitative Analysis, Financial Modeling, Machine Learning in Finance, and Real-World Trading Application Projects.",
  "devops-engineering": "Covering Cloud Infrastructure, Continuous Integration, Continuous Deployment, Infrastructure as Code, and Real-World DevOps Application Projects.",
  "machine-learning-specialist": "Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects."
};

for (let i = 1; i < blocks.length; i++) {
  let block = blocks[i];
  
  // extract slug from start of block
  const slugEnd = block.indexOf('"') !== -1 ? block.indexOf('"') : block.indexOf("'");
  if (slugEnd !== -1) {
    const slug = block.substring(0, slugEnd);
    
    if (courseToDesc[slug]) {
      // replace first occurrence of subSubtitle in this block
      const subTitleIndex = block.indexOf('subSubtitle:');
      if (subTitleIndex !== -1) {
        const lineEnd = block.indexOf('\\n', subTitleIndex);
        const prefix = block.substring(0, subTitleIndex);
        const suffix = block.substring(lineEnd);
        
        block = prefix + "subSubtitle: '" + courseToDesc[slug] + "'," + suffix;
        blocks[i] = block;
      }
    }
  }
}

// Rejoin the blocks
fs.writeFileSync(path, blocks.join('slug: "'), 'utf8');
console.log("Replaced perfectly via block splitting.");
