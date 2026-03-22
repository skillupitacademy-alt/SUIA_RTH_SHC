# 🌐 Multi-Platform Architecture — RealTutorialHub + SkillUp + SkillHubCore

## 🧠 Overview

This system consists of **3 interconnected platforms**:

1. **RealTutorialHub** → AI-powered self-learning + exam platform  
2. **SkillUp IT Academy** → Instructor-led training + career services  
3. **SkillHubCore** → Central backend platform (auth, subscription, routing)

---

# 🏗️ 1. RealTutorialHub (AI Learning Platform)

## 🎯 Purpose
- Self-paced learning
- AI Tutor system
- Structured content + exam engine
- Scalable for millions of users

## 🌐 Domains
- realtutorialhub.com
- notes.realtutorialhub.com
- quiz.realtutorialhub.com
- admin.realtutorialhub.com
- api.realtutorialhub.com

## ⚙️ Core Features

### Tutorial Engine
- Domain → Subject → Topic → Subtopic
- 6 Content Blocks:
  - Notes
  - Layman
  - Real-Life
  - Technical
  - Code
  - AI Tutor

### Learning Flow
Layman → Real-Life → Technical → Code → AI Tutor → Assignment

### Exam System
- Quiz-based evaluation
- Separate subdomain

### Remediation
- Weak topic detection
- Auto study plan generation

---

# 🧑‍🏫 2. SkillUp IT Academy (Human Training Platform)

## 🎯 Purpose
- Live training
- Internship + placement
- Instructor-led learning

## 🌐 Domains
- skillupitacademy.com
- enquiry.skillupitacademy.com
- admission.skillupitacademy.com
- schedule.skillupitacademy.com
- attendance.skillupitacademy.com
- learn.skillupitacademy.com
- cert.skillupitacademy.com
- internship.skillupitacademy.com
- placement.skillupitacademy.com
- admin.skillupitacademy.com

## ⚙️ Core Features

### Admission Types
1. Digital Learning (Notes + Exam)
2. Training (Live + Internship + Placement)

### Training System
- Batch-based learning
- Instructor scheduling

### Operations
- Attendance
- Certification
- Course tracking

### Integration
- Uses RealTutorialHub for notes + quiz

---

# 🧩 3. SkillHubCore (Platform Brain)

## 🎯 Purpose
Central system connecting all platforms

## 🌐 Domain
- skillhubcore.in

## ⚙️ Responsibilities

### API Layer
- api.skillhubcore.in

### Auth & Access
- Single Sign-On (SSO)
- User identity management

### Subscription Engine
- Free / Premium / Combo plans

### Routing Logic
- Cross-platform navigation

### Data Sync
- Progress
- Exam results
- Certification

---

# 🔗 Platform Integration

## RealTutorial User Flow
User → Notes → Learn → Quiz → Remediation → Upgrade to SkillUp

## SkillUp User Flow
User → Training → Uses RealTutorial → Faculty guidance → Placement

## Hybrid Flow
User accesses:
- AI Tutor
- Live training
- Exam + Certification
- Placement

---

# 🧱 Scalability Design

- Microservices via subdomains
- Async processing (webhooks, queues)
- AI + human content pipeline
- Separate concerns per platform

---

# 🧠 Final Positioning

RealTutorialHub = AI Learning Engine  
SkillUp = Human Training + Career Engine  
SkillHubCore = Platform Brain  

---

# 🚀 Status

## Completed
- Tutorial engine architecture
- Content framework
- Quiz + remediation system

## Pending
- SkillHubCore implementation
- SkillUp modules
- Payment system
- SSO integration

---

# 🔥 Conclusion

This is not a traditional LMS.

👉 It is a **Scalable AI + Human Hybrid Learning Ecosystem**
