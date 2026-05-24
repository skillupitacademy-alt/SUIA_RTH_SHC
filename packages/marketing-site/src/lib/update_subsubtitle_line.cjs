const fs = require('fs');

const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/CoursesCardData.ts';
let content = fs.readFileSync(path, 'utf8');

const mapping = {
  "MERN": "Covering MongoDB, Express.js, React, Node.js, REST APIs, AI Integration, Cloud Deployment, Scalable Architecture, and Real-World Full Stack AI Application Projects.",
  "MEAN": "Covering MongoDB, Express.js, Angular, Node.js, REST APIs, AI Integration, Cloud Deployment, Enterprise Architecture, and Real-World Full Stack AI Application Projects.",
  "Frontend": "Covering HTML, CSS, JavaScript, React, Responsive Design, UI/UX Principles, Performance Optimization, and Real-World Frontend Application Projects.",
  "Backend": "Covering Server-Side Development, REST APIs, Authentication, Database Management, Microservices, Cloud Deployment, Security Best Practices, and Real-World Backend Application Projects.",
  ".NET": "Covering C#, ASP.NET Core, REST APIs, Microservices, SQL Server, Frontend Development, AI Integration, Cloud Deployment, Enterprise Architecture, and Real-World Full Stack AI Application Projects.",
  "Python Full Stack": "Covering Python, Django, FastAPI, REST APIs, Database Management, Frontend Development, AI Integration, Machine Learning, Cloud Deployment, and Real-World Full Stack AI Application Projects.",
  "Python": "Covering Python, Django, FastAPI, REST APIs, Database Management, Frontend Development, AI Integration, Machine Learning, Cloud Deployment, and Real-World Full Stack AI Application Projects.",
  "Java": "Covering Java, Spring Boot, REST APIs, Microservices, Database Management, Frontend Development, AI Integration, Cloud Deployment, and Real-World Full Stack AI Application Projects.",
  "Data Science": "Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects.",
  "Data Analyst": "Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects.",
  "PHP": "Covering PHP, Laravel, MySQL, REST APIs, Frontend Development, Cloud Deployment, and Real-World Full Stack Application Projects.",
  "Cybersecurity": "Covering Network Security, Cryptography, Penetration Testing, Cloud Security, Incident Response, and Real-World Cybersecurity Application Projects.",
  "Ethical": "Covering Network Security, Cryptography, Penetration Testing, Cloud Security, Incident Response, and Real-World Cybersecurity Application Projects.",
  "DevOps": "Covering Cloud Infrastructure, Continuous Integration, Continuous Deployment, Infrastructure as Code, and Real-World DevOps Application Projects.",
  "Trading": "Covering Algorithmic Trading, Quantitative Analysis, Financial Modeling, Machine Learning in Finance, and Real-World Trading Application Projects."
};

function getReplacement(title) {
  for (const key in mapping) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return mapping[key];
    }
  }
  return mapping["Data Analyst"];
}

let lines = content.split('\\n');
let currentTitle = "";
let insideCourse = false;
let coursesFound = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Look for course title at 2 spaces indentation
  const titleMatch = line.match(/^  title:\s*"([^"]+)",/);
  if (titleMatch) {
    currentTitle = titleMatch[1];
    insideCourse = true;
  }
  
  // If we find subSubtitle at 10 spaces indentation (inside certificateDetails)
  if (insideCourse && line.includes('subSubtitle:')) {
    const replacement = getReplacement(currentTitle);
    lines[i] = `          subSubtitle: '${replacement}',`;
    coursesFound.push(currentTitle);
    insideCourse = false; // reset until next course
  }
}

fs.writeFileSync(path, lines.join('\\n'), 'utf8');
console.log("Updated courses:", coursesFound);
