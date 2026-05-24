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
  "PHP": "Covering PHP, Laravel, MySQL, REST APIs, Frontend Development, Cloud Deployment, and Real-World Full Stack Application Projects."
};

function getReplacement(title) {
  for (const key in mapping) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return mapping[key];
    }
  }
  return mapping["Data"]; // default fallback
}

// We need to parse allCourses and replace the subSubtitle field for each object
const allCoursesRegex = /export const allCourses: Course\[\] = \[([\s\S]*?)\];/;
const match = allCoursesRegex.exec(content);

if (match) {
  let allCoursesStr = match[1];
  
  // Replace each subSubtitle by looking at the course title
  // This is a bit tricky with regex, let's just do it by finding 'title: "..."' and the next 'subSubtitle: "..."'
  
  let resultStr = allCoursesStr;
  let titleRegex = /title:\s*"([^"]+)"/g;
  let titleMatch;
  
  let indices = [];
  while ((titleMatch = titleRegex.exec(resultStr)) !== null) {
    indices.push({ title: titleMatch[1], index: titleMatch.index });
  }
  
  for (let i = 0; i < indices.length; i++) {
    const current = indices[i];
    const next = indices[i + 1] ? indices[i + 1].index : resultStr.length;
    const slice = resultStr.substring(current.index, next);
    
    // ignore nested titles in curriculum or cards
    if (current.title === "Data Analyst" || 
        current.title === "Data Science & AI" || 
        current.title.includes("Full Stack") || 
        current.title.includes("Programming") ||
        current.title.includes("Data")) {
          
      const replacementText = getReplacement(current.title);
      
      const replacedSlice = slice.replace(/subSubtitle:\s*['"][^'"]+['"]/, \`subSubtitle: "\${replacementText}"\`);
      resultStr = resultStr.substring(0, current.index) + replacedSlice + resultStr.substring(next);
      
      // Update indices since length changed
      const diff = replacedSlice.length - slice.length;
      for (let j = i + 1; j < indices.length; j++) {
        indices[j].index += diff;
      }
    }
  }
  
  content = content.replace(allCoursesStr, resultStr);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Updated subSubtitles based on course titles!");
} else {
  console.log("Could not find allCourses array.");
}
