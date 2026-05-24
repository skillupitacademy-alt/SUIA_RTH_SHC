const fs = require('fs');

const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/CoursesCardData.ts';
let content = fs.readFileSync(path, 'utf8');

const mapping = {
  "MERN": "Covering MongoDB, Express.js, React, Node.js, REST APIs, AI Integration, Cloud Deployment, Scalable Architecture, and Real-World Full Stack AI Application Projects.",
  "MEAN": "Covering MongoDB, Express.js, Angular, Node.js, REST APIs, AI Integration, Cloud Deployment, Enterprise Architecture, and Real-World Full Stack AI Application Projects.",
  "Frontend": "Covering HTML, CSS, JavaScript, React, Responsive Design, UI/UX Principles, Performance Optimization, and Real-World Frontend Application Projects.",
  "Backend": "Covering Server-Side Development, REST APIs, Authentication, Database Management, Microservices, Cloud Deployment, Security Best Practices, and Real-World Backend Application Projects.",
  ".NET": "Covering C#, ASP.NET Core, REST APIs, Microservices, SQL Server, Frontend Development, AI Integration, Cloud Deployment, Enterprise Architecture, and Real-World Full Stack AI Application Projects.",
  "Python": "Covering Python, Django, FastAPI, REST APIs, Database Management, Frontend Development, AI Integration, Machine Learning, Cloud Deployment, and Real-World Full Stack AI Application Projects.",
  "Java": "Covering Java, Spring Boot, REST APIs, Microservices, Database Management, Frontend Development, AI Integration, Cloud Deployment, and Real-World Full Stack AI Application Projects.",
  "Data": "Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects.",
  "PHP": "Covering PHP, Laravel, MySQL, REST APIs, Frontend Development, Cloud Deployment, and Real-World Full Stack Application Projects.",
  "Cybersecurity": "Covering Network Security, Cryptography, Penetration Testing, Cloud Security, Incident Response, and Real-World Cybersecurity Application Projects.",
  "Ethical": "Covering Network Security, Cryptography, Penetration Testing, Cloud Security, Incident Response, and Real-World Cybersecurity Application Projects.",
  "Engineering": "Covering Cloud Infrastructure, Continuous Integration, Continuous Deployment, Infrastructure as Code, and Real-World DevOps Application Projects.",
  "DevOps": "Covering Cloud Infrastructure, Continuous Integration, Continuous Deployment, Infrastructure as Code, and Real-World DevOps Application Projects.",
  "Trading": "Covering Algorithmic Trading, Quantitative Analysis, Financial Modeling, Machine Learning in Finance, and Real-World Trading Application Projects."
};

function getReplacement(title) {
  for (const key in mapping) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return mapping[key];
    }
  }
  return mapping["Data"];
}

// Just globally replace subSubtitle based on the previous title match
let resultStr = content;
let titleRegex = /title:\s*"([^"]+)"/g;
let titleMatch;

let indices = [];
while ((titleMatch = titleRegex.exec(resultStr)) !== null) {
  indices.push({ title: titleMatch[1], index: titleMatch.index });
}

for (let i = 0; i < indices.length; i++) {
  const current = indices[i];
  const next = indices[i + 1] ? indices[i + 1].index : resultStr.length;
  
  if (current.title === "Data Analyst" || current.title === "Data Science & AI" || 
      current.title.includes("Full Stack") || current.title.includes("Programming") ||
      current.title.includes("Data") || current.title.includes("Cyber") || 
      current.title.includes("Ethical") || current.title.includes("DevOps") || 
      current.title.includes("Trading") || current.title.includes("Backend") || current.title.includes("Frontend") || current.title.includes("MEAN") || current.title.includes("MERN")) {
      
    const slice = resultStr.substring(current.index, next);
    const replacementText = getReplacement(current.title);
    
    // Replace the specific subSubtitle inside this slice
    const replacedSlice = slice.replace(/subSubtitle:\s*['"][^'"]+['"]/, "subSubtitle: '" + replacementText + "'");
    
    if (replacedSlice !== slice) {
      resultStr = resultStr.substring(0, current.index) + replacedSlice + resultStr.substring(next);
      const diff = replacedSlice.length - slice.length;
      for (let j = i + 1; j < indices.length; j++) {
        indices[j].index += diff;
      }
    }
  }
}

fs.writeFileSync(path, resultStr, 'utf8');
console.log("Updated subSubtitles based on course titles!");
