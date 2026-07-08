import { Chapter } from '../types';

export const chapter4: Chapter = {
  id: 'where-used',
  title: '4. Where Python is Used: Industry Applications',
  sections: [
    {
      type: 'paragraph',
      content: `Python’s versatility has allowed it to penetrate almost every subfield of computer science. Understanding where Python excels—and where it falls short—is critical for architectural decision-making.`
    },
    {
      type: 'heading2',
      content: '1. Artificial Intelligence & Data Science'
    },
    {
      type: 'paragraph',
      content: `This is Python’s undisputed domain. Because of the "glue" nature of the language, the world's most powerful data manipulation and neural network libraries provide Python interfaces.`
    },
    {
      type: 'info-box',
      title: 'Key Ecosystem Libraries',
      content: `<ul>
<li><strong>Pandas & NumPy:</strong> High-performance array and dataframe manipulation.</li>
<li><strong>TensorFlow & PyTorch:</strong> Deep learning frameworks developed by Google and Meta.</li>
<li><strong>Scikit-Learn:</strong> Traditional machine learning algorithms.</li>
</ul>`
    },
    {
      type: 'heading2',
      content: '2. Backend Web Development & Microservices'
    },
    {
      type: 'paragraph',
      content: `Python powers the backend infrastructure of massive applications. Instagram runs on Django, serving billions of requests. Spotify uses Python extensively for its backend API services and data pipelines.`
    },
    {
      type: 'paragraph',
      content: `Frameworks like <strong>Django</strong> (batteries-included, monolithic) and <strong>FastAPI</strong> (asynchronous, highly performant, microservice-friendly) represent the modern spectrum of Python web development.`
    },
    {
      type: 'heading2',
      content: '3. DevOps, Automation, & Infrastructure as Code'
    },
    {
      type: 'paragraph',
      content: `Bash scripting is excellent for simple tasks, but as infrastructure complexity grows, Bash becomes unmaintainable. Python is the language of choice for DevOps engineers. Tools like Ansible are written in Python. Python scripts are heavily used to manage AWS via <code>boto3</code>, automate CI/CD pipelines, and orchestrate Docker/Kubernetes deployments.`
    },
    {
      type: 'heading2',
      content: 'Where Python is NOT Recommended'
    },
    {
      type: 'warning-box',
      title: 'Architectural Limitations',
      content: `Do not use Python for:
<ul>
<li><strong>Mobile App Development:</strong> While frameworks like Kivy exist, iOS and Android native ecosystems (Swift, Kotlin) or specialized frameworks (React Native, Flutter) are vastly superior.</li>
<li><strong>Client-Side Web (Browser):</strong> JavaScript is the native language of the browser. Python (via PyScript/WASM) is largely experimental.</li>
<li><strong>Hard Real-Time Systems:</strong> Systems like pacemakers, automotive braking, or high-frequency trading engines cannot tolerate unpredictable Garbage Collection pauses. Use C, C++, or Rust.</li>
</ul>`
    },
    {
      type: 'interview-tip',
      content: `<strong>Q: When would you choose Go over Python for a backend service?</strong><br/>
<em>Answer:</em> If the service is entirely CPU-bound or requires extreme concurrency (handling millions of WebSocket connections), Go's goroutines and compiled nature provide a significant performance advantage over Python's Global Interpreter Lock (GIL).`
    }
  ]
};
