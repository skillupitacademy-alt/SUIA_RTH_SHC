-- =====================================================
-- DEVOPS DOMAIN SEED DATA
-- =====================================================

-- 1. Create the Domain (DevOps)
INSERT INTO domains (id, name, category, status)
VALUES ('30000000-0000-0000-0000-000000000006', 'DevOps', 'Infrastructure & Operations', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. Create 4 Subjects
INSERT INTO subjects (id, domain_id, name, status) VALUES
('40000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000006', 'CI/CD Pipelines', 'active'),
('40000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000006', 'Containerization & Orchestration', 'active'),
('40000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000006', 'Infrastructure as Code & Configuration Management', 'active'),
('40000000-0000-0000-0000-000000000024', '30000000-0000-0000-0000-000000000006', 'Monitoring, Logging & Observability', 'active')
ON CONFLICT (id) DO NOTHING;

-- 3. Create 8 Topics (2 per subject)
INSERT INTO topics (id, subject_id, name, status) VALUES
('50000000-0000-0000-0000-000000000041', '40000000-0000-0000-0000-000000000021', 'CI/CD Fundamentals', 'active'),
('50000000-0000-0000-0000-000000000042', '40000000-0000-0000-0000-000000000021', 'Advanced Pipelines & GitOps', 'active'),
('50000000-0000-0000-0000-000000000043', '40000000-0000-0000-0000-000000000022', 'Docker Basics', 'active'),
('50000000-0000-0000-0000-000000000044', '40000000-0000-0000-0000-000000000022', 'Kubernetes Core Concepts', 'active'),
('50000000-0000-0000-0000-000000000045', '40000000-0000-0000-0000-000000000023', 'Terraform Fundamentals', 'active'),
('50000000-0000-0000-0000-000000000046', '40000000-0000-0000-0000-000000000023', 'Ansible & Configuration Management', 'active'),
('50000000-0000-0000-0000-000000000047', '40000000-0000-0000-0000-000000000024', 'Prometheus & Grafana', 'active'),
('50000000-0000-0000-0000-000000000048', '40000000-0000-0000-0000-000000000024', 'Distributed Tracing & Logging', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. Questions (CI/CD Fundamentals - 1301+)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-000000000501', '50000000-0000-0000-0000-000000000041', 'simple', 'mcq', 'What does CI stand for in DevOps?', '["Continuous Integration", "Continuous Improvement", "Continuous Inspection", "Continuous Installation"]', 'Continuous Integration', 'CI is the practice of frequently integrating code changes into a shared repository.', 'active'),
('60000000-0000-0000-0000-000000000502', '50000000-0000-0000-0000-000000000041', 'simple', 'mcq', 'What is the main goal of a CI/CD pipeline?', '["Automate build, test, and deployment", "Manual deployment only", "Code review only", "Documentation generation"]', 'Automate build, test, and deployment', 'CI/CD aims to automate the software delivery process.', 'active'),
('60000000-0000-0000-0000-000000000504', '50000000-0000-0000-0000-000000000041', 'simple', 'mcq', 'What does CD stand for?', '["Continuous Deployment", "Continuous Development", "Code Delivery", "Continuous Debugging"]', 'Continuous Deployment', 'CD automates releasing every good build to production.', 'active'),
('60000000-0000-0000-0000-000000000505', '50000000-0000-0000-0000-000000000041', 'intermediate', 'mcq', 'Which is a common CI tool?', '["Jenkins", "Kubernetes", "Terraform", "Prometheus"]', 'Jenkins', 'Jenkins is one of the most widely used open-source CI/CD tools.', 'active'),
('60000000-0000-0000-0000-000000000506', '50000000-0000-0000-0000-000000000041', 'intermediate', 'mcq', 'What is a pipeline artifact?', '["Output files produced by a build", "Source code", "Configuration file", "Log file only"]', 'Output files produced by a build', 'Artifacts are files or directories passed between pipeline stages.', 'active'),
('60000000-0000-0000-0000-000000000507', '50000000-0000-0000-0000-000000000041', 'intermediate', 'mcq', 'What does a blue-green deployment strategy help with?', '["Zero-downtime deployments", "Faster builds", "Code reviews", "Logging"]', 'Zero-downtime deployments', 'Blue-green allows switching traffic between two identical environments.', 'active'),
('60000000-0000-0000-0000-000000000508', '50000000-0000-0000-0000-000000000041', 'intermediate', 'mcq', 'What is a canary release?', '["Releasing to a small subset of users first", "Full production release", "Rollback only", "Manual testing"]', 'Releasing to a small subset of users first', 'Canary reduces risk by gradual rollout.', 'active'),
('60000000-0000-0000-0000-000000000509', '50000000-0000-0000-0000-000000000041', 'expert', 'mcq', 'In GitOps, where is the desired state declared?', '["Git repository", "Kubernetes cluster", "Jenkins server", "Terraform state"]', 'Git repository', 'GitOps uses Git as the single source of truth for declarative infrastructure.', 'active'),
('60000000-0000-0000-0000-000000000510', '50000000-0000-0000-0000-000000000041', 'expert', 'mcq', 'What is ArgoCD commonly used for?', '["GitOps continuous delivery for Kubernetes", "CI builds", "Monitoring", "Configuration management"]', 'GitOps continuous delivery for Kubernetes', 'ArgoCD synchronizes cluster state with Git manifests.', 'active'),
('60000000-0000-0000-0000-000000000511', '50000000-0000-0000-0000-000000000041', 'expert', 'mcq', 'What problem does trunk-based development solve in CI/CD?', '["Long-lived feature branches and merge hell", "Slow builds", "High memory usage", "Security scanning"]', 'Long-lived feature branches and merge hell', 'Encourages frequent integration and small changes.', 'active'),
('60000000-0000-0000-0000-000000000512', '50000000-0000-0000-0000-000000000041', 'expert', 'mcq', 'What is a deployment gate in advanced pipelines?', '["Automated approval/check before promotion", "Manual code review", "Build trigger", "Artifact storage"]', 'Automated approval/check before promotion', 'Gates enforce quality gates (tests, security, etc.).', 'active'),
('60000000-0000-0000-0000-000000000513', '50000000-0000-0000-0000-000000000041', 'expert', 'mcq', 'Which pattern allows testing in production-like environments early?', '["Shift-left testing", "Shift-right testing", "Blue-green only", "Canary only"]', 'Shift-left testing', 'Testing earlier in the pipeline catches issues sooner.', 'active');

INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status) VALUES
('60000000-0000-0000-0000-000000000503', '50000000-0000-0000-0000-000000000041', 'simple', 'code_mcq', 'In GitHub Actions, what file defines the workflow?', '[".github/workflows/*.yml", "pipeline.json", "build.sh", "Dockerfile"]', '.github/workflows/*.yml', 'GitHub Actions workflows are defined in YAML files in the .github/workflows directory.', 'name: CI\non: [push]', 'active');

-- Docker Basics (1320+)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status) VALUES
('60000000-0000-0000-0000-000000000520', '50000000-0000-0000-0000-000000000043', 'simple', 'code_mcq', 'Which command builds a Docker image?', '["docker build", "docker run", "docker pull", "docker ps"]', 'docker build', 'docker build -t name:tag . creates an image from Dockerfile.', 'docker build -t myapp:1.0 .', 'active');

INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-000000000521', '50000000-0000-0000-0000-000000000043', 'simple', 'mcq', 'What is a Docker container?', '["Running instance of an image", "Image template", "Host OS", "Network policy"]', 'Running instance of an image', 'Containers are lightweight, isolated processes.', 'active');

-- Kubernetes Core Concepts (1340+)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-000000000540', '50000000-0000-0000-0000-000000000044', 'simple', 'mcq', 'What is the smallest deployable unit in Kubernetes?', '["Pod", "Deployment", "Service", "Namespace"]', 'Pod', 'A pod is one or more containers with shared storage/network.', 'active'),
('60000000-0000-0000-0000-000000000541', '50000000-0000-0000-0000-000000000044', 'intermediate', 'mcq', 'What does a Service of type ClusterIP do?', '["Exposes pods internally within cluster", "Exposes externally", "Load balances nodes", "Stores configuration"]', 'Exposes pods internally within cluster', 'ClusterIP is the default service type for internal access.', 'active');

-- Terraform Fundamentals (1360+)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status) VALUES
('60000000-0000-0000-0000-000000000560', '50000000-0000-0000-0000-000000000045', 'simple', 'code_mcq', 'Which command applies Terraform changes?', '["terraform apply", "terraform plan", "terraform init", "terraform destroy"]', 'terraform apply', 'apply executes the changes planned.', 'terraform apply', 'active');
