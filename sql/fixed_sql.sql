-- =====================================================
-- CLOUD COMPUTING DOMAIN SEED DATA
-- =====================================================

-- 1. Create the Cloud Computing Domain
INSERT INTO domains (id, name, category, status) 
VALUES ('30000000-0000-0000-0000-000000000001', 'Cloud Computing', 'Infrastructure', 'active');

-- =====================================================
-- SUBJECT 1: AWS Fundamentals
-- =====================================================
INSERT INTO subjects (id, domain_id, name, status) 
VALUES ('40000000-0000-0000-0000-030000000001', '30000000-0000-0000-0000-000000000001', 'AWS Fundamentals', 'active');

-- Topic 1.1: EC2 & S3
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000001', '40000000-0000-0000-0000-030000000001', 'EC2 & S3', 'active');

-- Simple Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010101000001', '50000000-0000-0000-0000-030400000001', 'simple', 'mcq', 'What does EC2 stand for in AWS?', '["Elastic Compute Cloud", "Elastic Cloud Compute", "Enterprise Computing Cloud", "Extended Computing Cluster"]', 'Elastic Compute Cloud', 'EC2 stands for Elastic Compute Cloud, which provides scalable computing capacity in the AWS cloud.', 'active'),
('60000000-0000-0000-0000-010101000002', '50000000-0000-0000-0000-030400000001', 'simple', 'mcq', 'Which S3 storage class is designed for frequently accessed data?', '["S3 Standard", "S3 Glacier", "S3 One Zone-IA", "S3 Intelligent-Tiering"]', 'S3 Standard', 'S3 Standard is designed for frequently accessed data with high durability and availability.', 'active'),
('60000000-0000-0000-0000-010101000003', '50000000-0000-0000-0000-030400000001', 'simple', 'mcq', 'What is the maximum size of a single object in S3?', '["5 TB", "500 GB", "50 TB", "Unlimited"]', '5 TB', 'A single Amazon S3 object can be up to 5 TB in size.', 'active'),
('60000000-0000-0000-0000-010101000004', '50000000-0000-0000-0000-030400000001', 'simple', 'mcq', 'Which EC2 instance type is optimized for compute-intensive workloads?', '["C type", "M type", "R type", "T type"]', 'C type', 'C-type instances (Compute optimized) are designed for compute-bound applications.', 'active');

-- Intermediate Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010101000005', '50000000-0000-0000-0000-030400000001', 'intermediate', 'mcq', 'Which storage class is optimized for data that is rarely accessed but requires millisecond retrieval?', '["S3 Standard", "S3 Standard-IA", "S3 Glacier", "S3 One Zone-IA"]', 'S3 Standard-IA', 'Standard Infrequent Access (S3 Standard-IA) is designed for data that is accessed less frequently but requires rapid access when needed.', 'active'),
('60000000-0000-0000-0000-010101000006', '50000000-0000-0000-0000-030400000001', 'intermediate', 'mcq', 'What is the purpose of an EC2 placement group?', '["To reduce costs", "To improve network performance between instances", "To automate backups", "To manage security groups"]', 'To improve network performance between instances', 'Placement groups influence the placement of EC2 instances to provide low-latency, high-throughput network connections.', 'active'),
('60000000-0000-0000-0000-010101000007', '50000000-0000-0000-0000-030400000001', 'intermediate', 'mcq', 'Which feature provides automatic scaling for EC2 instances?', '["AWS Auto Scaling", "EC2 Scale Manager", "Elastic Load Balancer", "CloudWatch Alarms"]', 'AWS Auto Scaling', 'AWS Auto Scaling monitors applications and automatically adjusts capacity to maintain steady, predictable performance.', 'active'),
('60000000-0000-0000-0000-010101000008', '50000000-0000-0000-0000-030400000001', 'intermediate', 'code_mcq', 'Which AWS CLI command lists all S3 buckets?', '["aws s3 list-buckets", "aws s3 ls", "aws s3 list-all", "aws s3 show-buckets"]', 'aws s3 ls', 'The correct AWS CLI command to list all S3 buckets is "aws s3 ls".', 'active');

-- Expert Questions (5)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010101000009', '50000000-0000-0000-0000-030400000001', 'expert', 'mcq', 'When using S3 Cross-Region Replication, what happens to objects that were created before enabling replication?', '["They are replicated automatically", "They are not replicated unless manually copied", "They are replicated after 24 hours", "They are replicated only if tagged"]', 'They are not replicated unless manually copied', 'S3 Cross-Region Replication only replicates objects created or updated after the replication configuration is enabled.', 'active'),
('60000000-0000-0000-0000-010101000010', '50000000-0000-0000-0000-030400000001', 'expert', 'mcq', 'What is the maximum number of security groups that can be attached to an EC2 instance?', '["5", "16", "60", "Unlimited"]', '5', 'You can attach up to 5 security groups to a single EC2 instance.', 'active'),
('60000000-0000-0000-0000-010101000011', '50000000-0000-0000-0000-030400000001', 'expert', 'code_mcq', 'Which CloudFormation intrinsic function would you use to reference an S3 bucket name from another stack?', '["Fn::ImportValue", "Fn::GetAtt", "Ref", "Fn::Sub"]', 'Fn::ImportValue', 'Fn::ImportValue imports values that are exported by other stacks using the Export output field.', 'active'),
('60000000-0000-0000-0000-010101000012', '50000000-0000-0000-0000-030400000001', 'expert', 'mcq', 'In S3 Intelligent-Tiering, what is the minimum storage duration before objects can move to the Infrequent Access tier?', '["30 days", "90 days", "180 days", "No minimum duration"]', '30 days', 'S3 Intelligent-Tiering monitors access patterns and moves objects that have not been accessed for 30 consecutive days to the Infrequent Access tier.', 'active'),
('60000000-0000-0000-0000-010101000013', '50000000-0000-0000-0000-030400000001', 'expert', 'mcq', 'What is the maximum number of target groups per Application Load Balancer?', '["10", "50", "100", "Unlimited"]', '100', 'An Application Load Balancer can have up to 100 target groups.', 'active');

-- Topic 1.2: IAM & Networking
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000002', '40000000-0000-0000-0000-030000000001', 'IAM & Networking', 'active');

-- Simple Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010102000001', '50000000-0000-0000-0000-030400000002', 'simple', 'mcq', 'What does IAM stand for in AWS?', '["Identity and Access Management", "Infrastructure Access Manager", "Integrated Account Management", "Internet Access Management"]', 'Identity and Access Management', 'IAM stands for Identity and Access Management, which controls access to AWS services and resources.', 'active'),
('60000000-0000-0000-0000-010102000002', '50000000-0000-0000-0000-030400000002', 'simple', 'mcq', 'What is a VPC in AWS?', '["Virtual Private Cloud", "Virtual Public Cloud", "Verified Private Connection", "Virtual Proxy Cluster"]', 'Virtual Private Cloud', 'VPC stands for Virtual Private Cloud, which provides an isolated section of the AWS Cloud.', 'active'),
('60000000-0000-0000-0000-010102000003', '50000000-0000-0000-0000-030400000002', 'simple', 'mcq', 'Which IAM entity represents a person or service that interacts with AWS?', '["Role", "Policy", "Group", "User"]', 'User', 'An IAM User represents a person or service that interacts with AWS resources.', 'active'),
('60000000-0000-0000-0000-010102000004', '50000000-0000-0000-0000-030400000002', 'simple', 'mcq', 'What is the default maximum number of VPCs per region?', '["5", "10", "50", "100"]', '5', 'By default, you can create up to 5 VPCs per AWS region.', 'active');

-- Intermediate Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010102000005', '50000000-0000-0000-0000-030400000002', 'intermediate', 'mcq', 'Which IAM policy type is attached directly to a user?', '["Managed Policy", "Inline Policy", "Group Policy", "Service Policy"]', 'Inline Policy', 'Inline policies are embedded directly into a single user, group, or role.', 'active'),
('60000000-0000-0000-0000-010102000006', '50000000-0000-0000-0000-030400000002', 'intermediate', 'mcq', 'What is the purpose of a NAT Gateway?', '["To allow instances in a private subnet to connect to the internet", "To provide DNS resolution", "To load balance traffic", "To encrypt network traffic"]', 'To allow instances in a private subnet to connect to the internet', 'A NAT Gateway enables instances in a private subnet to connect to the internet while preventing inbound connections.', 'active'),
('60000000-0000-0000-0000-010102000007', '50000000-0000-0000-0000-030400000002', 'intermediate', 'mcq', 'Which IAM feature allows temporary access to AWS resources?', '["IAM Roles", "IAM Users", "IAM Groups", "IAM Policies"]', 'IAM Roles', 'IAM Roles provide temporary security credentials for accessing AWS resources.', 'active'),
('60000000-0000-0000-0000-010102000008', '50000000-0000-0000-0000-030400000002', 'intermediate', 'code_mcq', 'What is the correct JSON structure for an IAM policy statement?', '["Statement: { Effect, Action, Resource }", "{ Statement: [ { Effect, Action, Resource } ] }", "[ { Statement: { Effect, Action, Resource } } ]", "{ Effect, Action, Resource }"]', '{ Statement: [ { Effect, Action, Resource } ] }', 'IAM policies use the structure: { "Statement": [ { "Effect": "...", "Action": "...", "Resource": "..." } ] }', 'active');

-- Expert Questions (5)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010102000009', '50000000-0000-0000-0000-030400000002', 'expert', 'mcq', 'What is the maximum size of an IAM policy document?', '["2 KB", "10 KB", "10240 characters", "2048 characters"]', '2048 characters', 'IAM policies cannot exceed 2048 characters when expressed in the AWS Management Console.', 'active'),
('60000000-0000-0000-0000-010102000010', '50000000-0000-0000-0000-030400000002', 'expert', 'mcq', 'When using VPC peering, what is true about CIDR blocks?', '["They must be identical", "They must not overlap", "They can overlap partially", "There are no restrictions"]', 'They must not overlap', 'VPC peering requires that the CIDR blocks of the peered VPCs do not overlap.', 'active'),
('60000000-0000-0000-0000-010102000011', '50000000-0000-0000-0000-030400000002', 'expert', 'mcq', 'What is the maximum number of rules per security group?', '["50", "60", "100", "250"]', '60', 'Each security group can have up to 60 rules (combined inbound and outbound).', 'active'),
('60000000-0000-0000-0000-010102000012', '50000000-0000-0000-0000-030400000002', 'expert', 'code_mcq', 'Which AWS CLI command creates an IAM user?', '["aws iam create-user", "aws iam add-user", "aws iam new-user", "aws iam user-create"]', 'aws iam create-user', 'The correct command is "aws iam create-user --user-name USERNAME".', 'active'),
('60000000-0000-0000-0000-010102000013', '50000000-0000-0000-0000-030400000002', 'expert', 'mcq', 'What is the maximum number of transit gateway attachments per VPC?', '["1", "5", "Unlimited", "Depends on VPC size"]', '5', 'A VPC can have up to 5 attachments to a transit gateway.', 'active');

-- =====================================================
-- SUBJECT 2: Azure Services
-- =====================================================
INSERT INTO subjects (id, domain_id, name, status) 
VALUES ('40000000-0000-0000-0000-030000000002', '30000000-0000-0000-0000-000000000001', 'Azure Services', 'active');

-- Topic 2.1: Azure Compute & Storage
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000003', '40000000-0000-0000-0000-030000000002', 'Azure Compute & Storage', 'active');

-- Simple Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010201000001', '50000000-0000-0000-0000-030400000003', 'simple', 'mcq', 'What is the Azure equivalent of AWS EC2?', '["Azure Virtual Machines", "Azure App Service", "Azure Functions", "Azure Container Instances"]', 'Azure Virtual Machines', 'Azure Virtual Machines provide on-demand scalable computing resources similar to AWS EC2.', 'active'),
('60000000-0000-0000-0000-010201000002', '50000000-0000-0000-0000-030400000003', 'simple', 'mcq', 'Which Azure service provides serverless computing?', '["Azure Functions", "Azure VMs", "Azure Kubernetes Service", "Azure Batch"]', 'Azure Functions', 'Azure Functions is a serverless compute service that runs event-triggered code without managing infrastructure.', 'active'),
('60000000-0000-0000-0000-010201000003', '50000000-0000-0000-0000-030400000003', 'simple', 'mcq', 'What is Azure Blob Storage primarily used for?', '["Storing unstructured data", "Relational databases", "Virtual machine disks", "Message queuing"]', 'Storing unstructured data', 'Azure Blob Storage is optimized for storing massive amounts of unstructured data like text or binary data.', 'active'),
('60000000-0000-0000-0000-010201000004', '50000000-0000-0000-0000-030400000003', 'simple', 'mcq', 'Which Azure service is used for container orchestration?', '["Azure Kubernetes Service (AKS)", "Azure Container Instances", "Azure Service Fabric", "Azure Batch"]', 'Azure Kubernetes Service (AKS)', 'AKS is a managed Kubernetes service for deploying and managing containerized applications.', 'active');

-- Intermediate Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010201000005', '50000000-0000-0000-0000-030400000003', 'intermediate', 'mcq', 'What is the difference between Azure Storage V1 and V2?', '["V2 includes hierarchical namespace", "V2 is cheaper", "V1 supports more regions", "V2 doesn''t support blobs"]', 'V2 includes hierarchical namespace', 'Storage V2 includes a hierarchical namespace feature that organizes objects into directories.', 'active'),
('60000000-0000-0000-0000-010201000006', '50000000-0000-0000-0000-030400000003', 'intermediate', 'mcq', 'Which Azure service provides auto-scaling for virtual machines?', '["Azure Virtual Machine Scale Sets", "Azure Load Balancer", "Azure Autoscale", "Azure Monitor"]', 'Azure Virtual Machine Scale Sets', 'VM Scale Sets allow you to create and manage a group of identical, load-balanced VMs that automatically scale.', 'active'),
('60000000-0000-0000-0000-010201000007', '50000000-0000-0000-0000-030400000003', 'intermediate', 'mcq', 'What is Azure Premium SSD best suited for?', '["Production workloads", "Development environments", "Archive storage", "Backup storage"]', 'Production workloads', 'Premium SSDs are designed for I/O-intensive production workloads that require low latency and high throughput.', 'active'),
('60000000-0000-0000-0000-010201000008', '50000000-0000-0000-0000-030400000003', 'intermediate', 'code_mcq', 'Which Azure CLI command lists all resource groups?', '["az group list", "az resource list", "az rg list", "az list-groups"]', 'az group list', 'The correct command is "az group list" to display all resource groups in a subscription.', 'active');

-- Expert Questions (5)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010201000009', '50000000-0000-0000-0000-030400000003', 'expert', 'mcq', 'What is the maximum size of a block blob in Azure Storage?', '["4.75 TB", "50 TB", "500 GB", "Unlimited"]', '4.75 TB', 'A single block blob can be up to approximately 4.75 TB in size.', 'active'),
('60000000-0000-0000-0000-010201000010', '50000000-0000-0000-0000-030400000003', 'expert', 'mcq', 'In Azure Functions, what is the maximum execution time for consumption plan?', '["5 minutes", "10 minutes", "30 minutes", "60 minutes"]', '10 minutes', 'Functions in the consumption plan have a maximum execution time of 10 minutes.', 'active'),
('60000000-0000-0000-0000-010201000011', '50000000-0000-0000-0000-030400000003', 'expert', 'mcq', 'What is the difference between Azure Spot VMs and Low-priority VMs in Batch?', '["Spot VMs can be evicted anytime", "Low-priority VMs are more expensive", "Spot VMs are only for Windows", "There is no difference"]', 'Spot VMs can be evicted anytime', 'Spot VMs can be evicted by Azure at any time when capacity is needed, while Low-priority VMs have different eviction policies.', 'active'),
('60000000-0000-0000-0000-010201000012', '50000000-0000-0000-0000-030400000003', 'expert', 'code_mcq', 'Which ARM template function retrieves a resource ID?', '["resourceId()", "reference()", "getResourceId()", "id()"]', 'resourceId()', 'The resourceId() function returns the unique identifier of a resource in Azure Resource Manager templates.', 'active'),
('60000000-0000-0000-0000-010201000013', '50000000-0000-0000-0000-030400000003', 'expert', 'mcq', 'What is the maximum number of vCPUs per virtual machine in Azure?', '["416", "896", "128", "256"]', '416', 'The M-series virtual machines support up to 416 vCPUs.', 'active');

-- Topic 2.2: Azure Networking & Security
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000004', '40000000-0000-0000-0000-030000000002', 'Azure Networking & Security', 'active');

-- Simple Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010202000001', '50000000-0000-0000-0000-030400000004', 'simple', 'mcq', 'What is Azure Virtual Network (VNet) equivalent to in AWS?', '["VPC", "Subnet", "Route Table", "Internet Gateway"]', 'VPC', 'Azure VNet is similar to AWS VPC, providing an isolated network environment in the cloud.', 'active'),
('60000000-0000-0000-0000-010202000002', '50000000-0000-0000-0000-030400000004', 'simple', 'mcq', 'Which Azure service provides DDoS protection?', '["Azure DDoS Protection", "Azure Firewall", "Azure Security Center", "Azure Network Watcher"]', 'Azure DDoS Protection', 'Azure DDoS Protection provides defense against distributed denial of service attacks.', 'active'),
('60000000-0000-0000-0000-010202000003', '50000000-0000-0000-0000-030400000004', 'simple', 'mcq', 'What is Azure Active Directory (AD) used for?', '["Identity and access management", "Network routing", "Storage management", "Compute optimization"]', 'Identity and access management', 'Azure AD is Microsoft''s cloud-based identity and access management service.', 'active'),
('60000000-0000-0000-0000-010202000004', '50000000-0000-0000-0000-030400000004', 'simple', 'mcq', 'Which Azure service provides a global load balancer?', '["Azure Traffic Manager", "Azure Load Balancer", "Azure Application Gateway", "Azure Front Door"]', 'Azure Traffic Manager', 'Azure Traffic Manager is a DNS-based traffic load balancer that distributes traffic globally.', 'active');

-- Intermediate Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010202000005', '50000000-0000-0000-0000-030400000004', 'intermediate', 'mcq', 'What is the purpose of Azure Network Security Groups (NSGs)?', '["Filter network traffic", "Balance load", "Monitor network performance", "Manage DNS records"]', 'Filter network traffic', 'NSGs contain security rules that allow or deny inbound/outbound network traffic.', 'active'),
('60000000-0000-0000-0000-010202000006', '50000000-0000-0000-0000-030400000004', 'intermediate', 'mcq', 'What is Azure ExpressRoute used for?', '["Private network connection to Azure", "Public internet access", "VPN connectivity", "DNS management"]', 'Private network connection to Azure', 'ExpressRoute establishes private connections between Azure datacenters and on-premises infrastructure.', 'active'),
('60000000-0000-0000-0000-010202000007', '50000000-0000-0000-0000-030400000004', 'intermediate', 'mcq', 'Which Azure service provides web application firewall capabilities?', '["Azure Application Gateway", "Azure Firewall", "Azure NSG", "Azure DDoS Protection"]', 'Azure Application Gateway', 'Application Gateway includes a web application firewall (WAF) that protects web applications from common vulnerabilities.', 'active'),
('60000000-0000-0000-0000-010202000008', '50000000-0000-0000-0000-030400000004', 'intermediate', 'code_mcq', 'Which PowerShell cmdlet creates a new virtual network?', '["New-AzVirtualNetwork", "Create-AzVNet", "Add-AzVirtualNetwork", "New-AzVNet"]', 'New-AzVirtualNetwork', 'The correct PowerShell cmdlet is New-AzVirtualNetwork.', 'active');

-- Expert Questions (5)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010202000009', '50000000-0000-0000-0000-030400000004', 'expert', 'mcq', 'What is the maximum number of routes in an Azure route table?', '["400", "1000", "200", "Unlimited"]', '400', 'An Azure route table can have up to 400 routes.', 'active'),
('60000000-0000-0000-0000-010202000010', '50000000-0000-0000-0000-030400000004', 'expert', 'mcq', 'In Azure AD, what is the maximum number of custom domains per tenant?', '["900", "5000", "100", "Unlimited"]', '900', 'An Azure AD tenant can have up to 900 verified domain names.', 'active'),
('60000000-0000-0000-0000-010202000011', '50000000-0000-0000-0000-030400000004', 'expert', 'mcq', 'What is the difference between Azure Standard and WAF_v2 SKU for Application Gateway?', '["v2 supports autoscaling", "Standard is cheaper", "v2 doesn''t support SSL", "Standard has better performance"]', 'v2 supports autoscaling', 'The v2 SKU supports autoscaling, while v1 (Standard) requires manual scaling.', 'active'),
('60000000-0000-0000-0000-010202000012', '50000000-0000-0000-0000-030400000004', 'expert', 'code_mcq', 'Which Azure CLI command creates a network security group rule?', '["az network nsg rule create", "az nsg rule add", "az network rule create", "az security rule create"]', 'az network nsg rule create', 'The correct command is "az network nsg rule create".', 'active'),
('60000000-0000-0000-0000-010202000013', '50000000-0000-0000-0000-030400000004', 'expert', 'mcq', 'What is the maximum bandwidth for Azure ExpressRoute?', '["100 Gbps", "10 Gbps", "1 Gbps", "40 Gbps"]', '100 Gbps', 'ExpressRoute circuits support bandwidths up to 100 Gbps.', 'active');

-- =====================================================
-- SUBJECT 3: Google Cloud Platform
-- =====================================================
INSERT INTO subjects (id, domain_id, name, status) 
VALUES ('40000000-0000-0000-0000-030000000003', '30000000-0000-0000-0000-000000000001', 'Google Cloud Platform', 'active');

-- Topic 3.1: GCP Core Services
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000005', '40000000-0000-0000-0000-030000000003', 'GCP Core Services', 'active');

-- Simple Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010301000001', '50000000-0000-0000-0000-030400000005', 'simple', 'mcq', 'What is the GCP equivalent of AWS EC2?', '["Compute Engine", "App Engine", "Cloud Functions", "Kubernetes Engine"]', 'Compute Engine', 'Google Compute Engine provides virtual machines similar to AWS EC2.', 'active'),
('60000000-0000-0000-0000-010301000002', '50000000-0000-0000-0000-030400000005', 'simple', 'mcq', 'Which GCP service provides object storage?', '["Cloud Storage", "Cloud SQL", "Cloud Spanner", "Cloud Datastore"]', 'Cloud Storage', 'Cloud Storage is GCP''s object storage service for storing and retrieving any amount of data.', 'active'),
('60000000-0000-0000-0000-010301000003', '50000000-0000-0000-0000-030400000005', 'simple', 'mcq', 'What is Google Kubernetes Engine (GKE) used for?', '["Container orchestration", "Serverless computing", "Virtual machines", "Data warehousing"]', 'Container orchestration', 'GKE is a managed Kubernetes service for deploying, managing, and scaling containerized applications.', 'active'),
('60000000-0000-0000-0000-010301000004', '50000000-0000-0000-0000-030400000005', 'simple', 'mcq', 'Which GCP service is serverless and event-driven?', '["Cloud Functions", "Compute Engine", "App Engine", "Cloud Run"]', 'Cloud Functions', 'Cloud Functions is a serverless execution environment for building and connecting cloud services.', 'active');

-- Intermediate Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010301000005', '50000000-0000-0000-0000-030400000005', 'intermediate', 'mcq', 'What is the difference between Cloud Storage regional and multi-regional?', '["Multi-regional has higher availability", "Regional is cheaper", "Multi-regional stores in one region", "Regional has better performance"]', 'Multi-regional has higher availability', 'Multi-regional storage replicates data across multiple regions for higher availability and lower latency.', 'active'),
('60000000-0000-0000-0000-010301000006', '50000000-0000-0000-0000-030400000005', 'intermediate', 'mcq', 'Which GCP service provides managed relational databases?', '["Cloud SQL", "Cloud Spanner", "Cloud Datastore", "Bigtable"]', 'Cloud SQL', 'Cloud SQL provides fully managed MySQL, PostgreSQL, and SQL Server databases.', 'active'),
('60000000-0000-0000-0000-010301000007', '50000000-0000-0000-0000-030400000005', 'intermediate', 'mcq', 'What is the purpose of Cloud Load Balancing?', '["Distribute traffic across instances", "Store data globally", "Monitor application performance", "Secure network traffic"]', 'Distribute traffic across instances', 'Cloud Load Balancing distributes incoming traffic across multiple backend instances in one or more regions.', 'active'),
('60000000-0000-0000-0000-010301000008', '50000000-0000-0000-0000-030400000005', 'intermediate', 'code_mcq', 'Which gcloud command lists all Compute Engine instances?', '["gcloud compute instances list", "gcloud instances list", "gcloud compute list-instances", "gcloud vm list"]', 'gcloud compute instances list', 'The correct command is "gcloud compute instances list".', 'active');

-- Expert Questions (5)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010301000009', '50000000-0000-0000-0000-030400000005', 'expert', 'mcq', 'What is the maximum number of persistent disks that can be attached to a Compute Engine instance?', '["128", "256", "64", "16"]', '128', 'A Compute Engine instance can have up to 128 persistent disks attached.', 'active'),
('60000000-0000-0000-0000-010301000010', '50000000-0000-0000-0000-030400000005', 'expert', 'mcq', 'In Cloud Storage, what is the maximum size of a single object?', '["5 TB", "10 TB", "1 TB", "Unlimited"]', '5 TB', 'A single object in Cloud Storage can be up to 5 TB in size.', 'active'),
('60000000-0000-0000-0000-010301000011', '50000000-0000-0000-0000-030400000005', 'expert', 'mcq', 'What is the difference between preemptible and regular VMs?', '["Preemptible can be terminated anytime", "Preemptible are more expensive", "Regular VMs have less memory", "There is no difference"]', 'Preemptible can be terminated anytime', 'Preemptible VMs are much cheaper but can be terminated by GCP with 30 seconds notice.', 'active'),
('60000000-0000-0000-0000-010301000012', '50000000-0000-0000-0000-030400000005', 'expert', 'code_mcq', 'Which command creates a Cloud Storage bucket?', '["gsutil mb gs://bucket-name", "gcloud storage create bucket", "gs create bucket", "gcloud mb gs://bucket-name"]', 'gsutil mb gs://bucket-name', 'The correct command is "gsutil mb gs://bucket-name" to make a bucket.', 'active'),
('60000000-0000-0000-0000-010301000013', '50000000-0000-0000-0000-030400000005', 'expert', 'mcq', 'What is the maximum number of networks per project?', '["25", "100", "5", "Unlimited"]', '25', 'Each GCP project can have up to 25 VPC networks.', 'active');

-- Topic 3.2: GCP Advanced Services
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000006', '40000000-0000-0000-0000-030000000003', 'GCP Advanced Services', 'active');

-- Simple Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010302000001', '50000000-0000-0000-0000-030400000006', 'simple', 'mcq', 'What is BigQuery primarily used for?', '["Data warehousing and analytics", "Real-time messaging", "Object storage", "Virtual machines"]', 'Data warehousing and analytics', 'BigQuery is a serverless, highly scalable data warehouse for analytics.', 'active'),
('60000000-0000-0000-0000-010302000002', '50000000-0000-0000-0000-030400000006', 'simple', 'mcq', 'Which GCP service provides pub/sub messaging?', '["Cloud Pub/Sub", "Cloud Tasks", "Cloud Scheduler", "Cloud Messaging"]', 'Cloud Pub/Sub', 'Cloud Pub/Sub provides asynchronous messaging between applications and services.', 'active'),
('60000000-0000-0000-0000-010302000003', '50000000-0000-0000-0000-030400000006', 'simple', 'mcq', 'What is Cloud Spanner designed for?', '["Globally distributed relational database", "Object storage", "Container orchestration", "Serverless computing"]', 'Globally distributed relational database', 'Cloud Spanner is a globally distributed, strongly consistent relational database service.', 'active'),
('60000000-0000-0000-0000-010302000004', '50000000-0000-0000-0000-030400000006', 'simple', 'mcq', 'Which service provides machine learning capabilities in GCP?', '["AI Platform", "Cloud ML Engine", "TensorFlow Enterprise", "All of the above"]', 'All of the above', 'GCP offers multiple ML services including AI Platform, Cloud ML Engine, and TensorFlow Enterprise.', 'active');

-- Intermediate Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010302000005', '50000000-0000-0000-0000-030400000006', 'intermediate', 'mcq', 'What is the difference between Cloud Datastore and Cloud Firestore?', '["Firestore is newer with more features", "Datastore is for relational data", "Firestore doesn''t scale", "They are the same"]', 'Firestore is newer with more features', 'Cloud Firestore is the newer version with additional features like real-time updates and mobile/web client libraries.', 'active'),
('60000000-0000-0000-0000-010302000006', '50000000-0000-0000-0000-030400000006', 'intermediate', 'mcq', 'Which GCP service provides secrets management?', '["Secret Manager", "KMS", "Cloud HSM", "IAM Secrets"]', 'Secret Manager', 'Secret Manager provides secure storage and management of API keys, passwords, certificates, and other sensitive data.', 'active'),
('60000000-0000-0000-0000-010302000007', '50000000-0000-0000-0000-030400000006', 'intermediate', 'mcq', 'What is Cloud CDN used for?', '["Content delivery and caching", "Database acceleration", "Network security", "Load balancing"]', 'Content delivery and caching', 'Cloud CDN caches content at Google''s edge locations to deliver lower latency and reduce origin load.', 'active'),
('60000000-0000-0000-0000-010302000008', '50000000-0000-0000-0000-030400000006', 'intermediate', 'code_mcq', 'Which command deploys a Cloud Function?', '["gcloud functions deploy", "gcloud deploy function", "gcloud function create", "deploy gcloud function"]', 'gcloud functions deploy', 'The correct command is "gcloud functions deploy FUNCTION_NAME".', 'active');

-- Expert Questions (5)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010302000009', '50000000-0000-0000-0000-030400000006', 'expert', 'mcq', 'What is the maximum query size in BigQuery?', '["1 MB", "10 MB", "100 MB", "1 GB"]', '1 MB', 'The maximum size of a query string in BigQuery is 1 MB.', 'active'),
('60000000-0000-0000-0000-010302000010', '50000000-0000-0000-0000-030400000006', 'expert', 'mcq', 'In Cloud Spanner, what is the maximum database size?', '["Petabyte-scale", "10 TB", "100 GB", "Unlimited"]', 'Petabyte-scale', 'Cloud Spanner databases can scale to petabyte size while maintaining strong consistency.', 'active'),
('60000000-0000-0000-0000-010302000011', '50000000-0000-0000-0000-030400000006', 'expert', 'mcq', 'What is the maximum message size in Cloud Pub/Sub?', '["10 MB", "1 MB", "100 KB", "1 GB"]', '10 MB', 'The maximum size of a message (including attributes) is 10 MB.', 'active'),
('60000000-0000-0000-0000-010302000012', '50000000-0000-0000-0000-030400000006', 'expert', 'code_mcq', 'Which BigQuery SQL function converts time zones?', '["TIMESTAMP()", "PARSE_TIMESTAMP()", "FORMAT_TIMESTAMP()", "DATE()"]', 'FORMAT_TIMESTAMP()', 'FORMAT_TIMESTAMP() can convert timestamps between time zones in BigQuery.', 'active'),
('60000000-0000-0000-0000-010302000013', '50000000-0000-0000-0000-030400000006', 'expert', 'mcq', 'What is the maximum number of IAM policies per resource?', '["150", "1000", "50", "Unlimited"]', '150', 'A single resource can have up to 150 IAM policies.', 'active');

-- =====================================================
-- SUBJECT 4: Cloud Architecture & DevOps
-- =====================================================
INSERT INTO subjects (id, domain_id, name, status) 
VALUES ('40000000-0000-0000-0000-030000000004', '30000000-0000-0000-0000-000000000001', 'Cloud Architecture & DevOps', 'active');

-- Topic 4.1: Cloud Design Patterns
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000007', '40000000-0000-0000-0000-030000000004', 'Cloud Design Patterns', 'active');

-- Simple Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010401000001', '50000000-0000-0000-0000-030400000007', 'simple', 'mcq', 'What is the purpose of the Circuit Breaker pattern?', '["Prevent cascading failures", "Load balancing", "Data encryption", "Cost optimization"]', 'Prevent cascading failures', 'The Circuit Breaker pattern prevents an application from repeatedly trying to execute an operation that''s likely to fail.', 'active'),
('60000000-0000-0000-0000-010401000002', '50000000-0000-0000-0000-030400000007', 'simple', 'mcq', 'Which pattern is used for handling sudden traffic spikes?', '["Queue-based Load Leveling", "Circuit Breaker", "Retry Pattern", "Sharding"]', 'Queue-based Load Leveling', 'Queue-based Load Leveling uses a queue as a buffer to handle bursts of traffic.', 'active'),
('60000000-0000-0000-0000-010401000003', '50000000-0000-0000-0000-030400000007', 'simple', 'mcq', 'What does the Retry pattern help with?', '["Transient failures", "Permanent failures", "Security breaches", "Data corruption"]', 'Transient failures', 'The Retry pattern enables an application to handle transient failures by retrying failed operations.', 'active'),
('60000000-0000-0000-0000-010401000004', '50000000-0000-0000-0000-030400000007', 'simple', 'mcq', 'Which pattern improves database performance by splitting data?', '["Sharding", "Caching", "Replication", "Indexing"]', 'Sharding', 'Sharding distributes data across multiple databases to improve performance and scalability.', 'active');

-- Intermediate Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010401000005', '50000000-0000-0000-0000-030400000007', 'intermediate', 'mcq', 'What is the difference between blue-green and canary deployments?', '["Blue-green switches all traffic at once", "Canary is slower and safer", "Blue-green is riskier", "They are the same"]', 'Blue-green switches all traffic at once', 'Blue-green deploys the new version alongside the old, then switches all traffic. Canary gradually shifts traffic.', 'active'),
('60000000-0000-0000-0000-010401000006', '50000000-0000-0000-0000-030400000007', 'intermediate', 'mcq', 'Which pattern is best for processing large datasets?', '["MapReduce", "Circuit Breaker", "Retry", "CQRS"]', 'MapReduce', 'MapReduce divides large datasets into smaller chunks, processes them in parallel, then combines results.', 'active'),
('60000000-0000-0000-0000-010401000007', '50000000-0000-0000-0000-030400000007', 'intermediate', 'mcq', 'What is the purpose of the CQRS pattern?', '["Separate read and write operations", "Combine databases", "Simplify queries", "Encrypt data"]', 'Separate read and write operations', 'CQRS (Command Query Responsibility Segregation) separates read and write operations for better performance and scalability.', 'active'),
('60000000-0000-0000-0000-010401000008', '50000000-0000-0000-0000-030400000007', 'intermediate', 'code_mcq', 'Which AWS service implements the Circuit Breaker pattern?', '["AWS App Mesh", "AWS X-Ray", "AWS Step Functions", "AWS Lambda"]', 'AWS App Mesh', 'AWS App Mesh provides circuit breaking capabilities for microservices.', 'active');

-- Expert Questions (5)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010401000009', '50000000-0000-0000-0000-030400000007', 'expert', 'mcq', 'In the Event Sourcing pattern, how is application state determined?', '["By replaying events", "By querying database", "By checking logs", "By user input"]', 'By replaying events', 'Event Sourcing persists state as a sequence of events, and state is reconstructed by replaying those events.', 'active'),
('60000000-0000-0000-0000-010401000010', '50000000-0000-0000-0000-030400000007', 'expert', 'mcq', 'What is the main disadvantage of the Saga pattern?', '["Complex error handling", "Poor performance", "Security issues", "High cost"]', 'Complex error handling', 'The Saga pattern can become complex due to the need for compensating transactions for error handling.', 'active'),
('60000000-0000-0000-0000-010401000011', '50000000-0000-0000-0000-030400000007', 'expert', 'mcq', 'Which pattern is most effective for reducing database load?', '["Caching", "Sharding", "Replication", "Indexing"]', 'Caching', 'Caching stores frequently accessed data in memory to reduce database queries and improve performance.', 'active'),
('60000000-0000-0000-0000-010401000012', '50000000-0000-0000-0000-030400000007', 'expert', 'code_mcq', 'Which Azure service implements the Retry pattern automatically?', '["Azure Service Bus", "Azure Storage", "Azure Functions", "All of the above"]', 'All of the above', 'Many Azure services including Service Bus, Storage, and Functions have built-in retry mechanisms.', 'active'),
('60000000-0000-0000-0000-010401000013', '50000000-0000-0000-0000-030400000007', 'expert', 'mcq', 'What is the maximum number of retries recommended in the Retry pattern?', '["3-5", "10-15", "Unlimited", "1"]', '3-5', 'Typically, 3-5 retries are recommended to balance between success rate and user experience.', 'active');

-- Topic 4.2: Infrastructure as Code
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000008', '40000000-0000-0000-0000-030000000004', 'Infrastructure as Code', 'active');

-- Simple Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010402000001', '50000000-0000-0000-0000-030400000008', 'simple', 'mcq', 'What is Terraform primarily used for?', '["Infrastructure as Code", "Configuration Management", "Continuous Integration", "Monitoring"]', 'Infrastructure as Code', 'Terraform is an Infrastructure as Code tool for building, changing, and versioning infrastructure safely and efficiently.', 'active'),
('60000000-0000-0000-0000-010402000002', '50000000-0000-0000-0000-030400000008', 'simple', 'mcq', 'Which tool is mainly used for configuration management?', '["Ansible", "Terraform", "CloudFormation", "Packer"]', 'Ansible', 'Ansible is a configuration management tool that automates software provisioning, configuration, and deployment.', 'active'),
('60000000-0000-0000-0000-010402000003', '50000000-0000-0000-0000-030400000008', 'simple', 'mcq', 'What does AWS CloudFormation do?', '["Provision AWS resources", "Monitor AWS services", "Secure AWS accounts", "Optimize AWS costs"]', 'Provision AWS resources', 'AWS CloudFormation provides a common language to model and provision AWS resources.', 'active'),
('60000000-0000-0000-0000-010402000004', '50000000-0000-0000-0000-030400000008', 'simple', 'mcq', 'What is the main benefit of Infrastructure as Code?', '["Consistency and reproducibility", "Lower costs", "Better performance", "Simpler code"]', 'Consistency and reproducibility', 'IaC ensures infrastructure is deployed consistently and can be reproduced exactly.', 'active');

-- Intermediate Questions (4)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010402000005', '50000000-0000-0000-0000-030400000008', 'intermediate', 'mcq', 'What is the difference between Terraform and Ansible?', '["Terraform provisions, Ansible configures", "Ansible is cloud-only", "Terraform is agent-based", "They are identical"]', 'Terraform provisions, Ansible configures', 'Terraform is for provisioning infrastructure, while Ansible is for configuring existing infrastructure.', 'active'),
('60000000-0000-0000-0000-010402000006', '50000000-0000-0000-0000-030400000008', 'intermediate', 'mcq', 'Which Terraform command initializes a working directory?', '["terraform init", "terraform plan", "terraform apply", "terraform validate"]', 'terraform init', 'The "terraform init" command initializes a working directory containing Terraform configuration files.', 'active'),
('60000000-0000-0000-0000-010402000007', '50000000-0000-0000-0000-030400000008', 'intermediate', 'mcq', 'What is a Terraform state file used for?', '["Track resource metadata", "Store secrets", "Log actions", "Monitor performance"]', 'Track resource metadata', 'The state file maps Terraform resources to real-world infrastructure and tracks metadata.', 'active'),
('60000000-0000-0000-0000-010402000008', '50000000-0000-0000-0000-030400000008', 'intermediate', 'code_mcq', 'Which CloudFormation section defines resources?', '["Resources", "Parameters", "Outputs", "Mappings"]', 'Resources', 'The Resources section is required and declares the AWS resources to be created or modified.', 'active');

-- Expert Questions (5)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
('60000000-0000-0000-0000-010402000009', '50000000-0000-0000-0000-030400000008', 'expert', 'mcq', 'What is Terraform''s maximum limit for resource dependencies?', '["Unlimited", "1000", "100", "10"]', 'Unlimited', 'Terraform can handle unlimited resource dependencies through its dependency graph.', 'active'),
('60000000-0000-0000-0000-010402000010', '50000000-0000-0000-0000-030400000008', 'expert', 'mcq', 'In CloudFormation, what is the maximum size of a template?', '["1 MB", "5 MB", "10 MB", "50 MB"]', '1 MB', 'AWS CloudFormation templates cannot exceed 1 MB in size.', 'active'),
('60000000-0000-0000-0000-010402000011', '50000000-0000-0000-0000-030400000008', 'expert', 'mcq', 'What is Terraform workspace used for?', '["Manage multiple environments", "Store state files", "Share modules", "Test configurations"]', 'Manage multiple environments', 'Workspaces allow managing multiple distinct sets of infrastructure resources with the same configuration.', 'active'),
('60000000-0000-0000-0000-010402000012', '50000000-0000-0000-0000-030400000008', 'expert', 'code_mcq', 'Which Ansible module is used for copying files?', '["copy", "file", "template", "sync"]', 'copy', 'The "copy" module copies files from local machine to remote hosts.', 'active'),
('60000000-0000-0000-0000-010402000013', '50000000-0000-0000-0000-030400000008', 'expert', 'mcq', 'What is the maximum number of parameters in a CloudFormation template?', '["200", "60", "100", "Unlimited"]', '60', 'A CloudFormation template can have up to 60 parameters.', 'active');

-- ============================================
-- WEB DEVELOPMENT DOMAIN SEED DATA
-- Total: 100 Questions across 4 Subjects, 8 Topics
-- Following 30/30/40 difficulty distribution
-- ============================================

-- 1. CREATE THE WEB DEVELOPMENT DOMAIN
INSERT INTO domains (id, name, category, status) 
VALUES ('30000000-0000-0000-0000-000000000002', 'Web Development', 'Software Development', 'active');

-- ============================================
-- SUBJECT 1: Frontend Development (React.js)
-- ============================================

-- 2. CREATE SUBJECT: React.js
INSERT INTO subjects (id, domain_id, name, status) 
VALUES ('40000000-0000-0000-0000-030000000001', '30000000-0000-0000-0000-000000000002', 'React.js', 'active');

-- 3. CREATE TOPIC 1: React Fundamentals
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000001', '40000000-0000-0000-0000-030000000001', 'React Fundamentals', 'active');

-- 4. CREATE QUESTIONS FOR TOPIC 1 (13 questions)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
-- Simple Questions (4)
('60000000-0000-0000-0000-010101000001', '50000000-0000-0000-0000-030400000001', 'simple', 'mcq', 'What is React primarily used for?', '["Backend APIs", "Building user interfaces", "Database management", "Mobile apps only"]', 'Building user interfaces', 'React is a JavaScript library for building user interfaces, particularly for single-page applications.', 'active'),
('60000000-0000-0000-0000-010101000002', '50000000-0000-0000-0000-030400000001', 'simple', 'mcq', 'Which method is called when a component is first mounted?', '["componentWillMount", "componentDidMount", "componentMounted", "render"]', 'componentDidMount', 'componentDidMount is a lifecycle method invoked immediately after a component is mounted (inserted into the tree).', 'active'),
('60000000-0000-0000-0000-010101000003', '50000000-0000-0000-0000-030400000001', 'simple', 'mcq', 'What does JSX stand for?', '["JavaScript XML", "Java Syntax Extension", "JavaScript Extension", "JS XML"]', 'JavaScript XML', 'JSX stands for JavaScript XML, which is a syntax extension for JavaScript that allows writing HTML-like code in React.', 'active'),
('60000000-0000-0000-0000-010101000004', '50000000-0000-0000-0000-030400000001', 'simple', 'code_mcq', 'What will this code output? const element = <h1>Hello, world!</h1>;

', '["HTML string", "React element", "JavaScript object", "Syntax error"]', 'React element', 'JSX transpiles to React.createElement() calls, which return React elements (JavaScript objects).', 'active'),

-- Intermediate Questions (4)
('60000000-0000-0000-0000-010101000005', '50000000-0000-0000-0000-030400000001', 'intermediate', 'mcq', 'What is the purpose of keys in React lists?', '["Improve performance", "Add styling", "Enable state updates", "Handle events"]', 'Improve performance', 'Keys help React identify which items have changed, are added, or are removed, improving reconciliation performance.', 'active'),
('60000000-0000-0000-0000-010101000006', '50000000-0000-0000-0000-030400000001', 'intermediate', 'mcq', 'Which hook replaces componentDidUpdate?', '["useEffect", "useState", "useMemo", "useCallback"]', 'useEffect', 'useEffect with dependencies can mimic componentDidUpdate behavior in functional components.', 'active'),
('60000000-0000-0000-0000-010101000007', '50000000-0000-0000-0000-030400000001', 'intermediate', 'mcq', 'What is prop drilling?', '["Passing props through multiple levels", "Validating props", "Setting default props", "Prop mutation"]', 'Passing props through multiple levels', 'Prop drilling refers to passing props through multiple intermediate components to reach a deeply nested component.', 'active'),
('60000000-0000-0000-0000-010101000008', '50000000-0000-0000-0000-030400000001', 'intermediate', 'code_mcq', 'What does this code do? const [count, setCount] = useState(0);

', '["Creates a state variable", "Creates a ref", "Creates an effect", "Creates a context"]', 'Creates a state variable', 'useState hook creates a state variable (count) and a function to update it (setCount), initialized to 0.', 'active'),

-- Expert Questions (5)
('60000000-0000-0000-0000-010101000009', '50000000-0000-0000-0000-030400000001', 'expert', 'mcq', 'What is the Virtual DOM?', '["A lightweight copy of the real DOM", "A browser API", "A CSS framework", "A state management tool"]', 'A lightweight copy of the real DOM', 'Virtual DOM is a programming concept where an ideal, or "virtual", representation of the UI is kept in memory.', 'active'),
('60000000-0000-0000-0000-010101000010', '50000000-0000-0000-0000-030400000001', 'expert', 'mcq', 'When should you use useMemo?', '["To memoize expensive calculations", "To handle side effects", "To manage context", "To create refs"]', 'To memoize expensive calculations', 'useMemo memoizes expensive calculations, recomputing only when dependencies change.', 'active'),
('60000000-0000-0000-0000-010101000011', '50000000-0000-0000-0000-030400000001', 'expert', 'code_mcq', 'What problem does this pattern solve? const ThemeContext = React.createContext();

', '["Prop drilling", "Component reusability", "State management", "All of the above"]', 'Prop drilling', 'Context API helps avoid prop drilling by providing a way to pass data through the component tree without passing props manually.', 'active'),
('60000000-0000-0000-0000-010101000012', '50000000-0000-0000-0000-030400000001', 'expert', 'mcq', 'What is reconciliation in React?', '["The diffing algorithm", "State synchronization", "Prop validation", "Error handling"]', 'The diffing algorithm', 'Reconciliation is React''s diffing algorithm that determines what changed in the Virtual DOM to update the actual DOM.', 'active'),
('60000000-0000-0000-0000-010101000013', '50000000-0000-0000-0000-030400000001', 'expert', 'mcq', 'Which lifecycle method is unsafe for side effects?', '["componentWillMount", "componentDidMount", "shouldComponentUpdate", "componentWillUnmount"]', 'componentWillMount', 'componentWillMount is deprecated and unsafe for side effects;

use componentDidMount instead.', 'active');

-- 5. CREATE TOPIC 2: React Advanced Concepts
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000002', '40000000-0000-0000-0000-030000000001', 'React Advanced Concepts', 'active');

-- 6. CREATE QUESTIONS FOR TOPIC 2 (13 questions)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
-- Simple Questions (4)
('60000000-0000-0000-0000-010102000001', '50000000-0000-0000-0000-030400000002', 'simple', 'mcq', 'What is a Higher-Order Component (HOC)?', '["A component that takes a component and returns a new component", "A base component", "A hook", "A context provider"]', 'A component that takes a component and returns a new component', 'HOCs are functions that take a component and return a new component with additional props or behavior.', 'active'),
('60000000-0000-0000-0000-010102000002', '50000000-0000-0000-0000-030400000002', 'simple', 'mcq', 'What is React Router used for?', '["Client-side routing", "API routing", "Database routing", "Server routing"]', 'Client-side routing', 'React Router enables client-side routing in React applications.', 'active'),
('60000000-0000-0000-0000-010102000003', '50000000-0000-0000-0000-030400000002', 'simple', 'mcq', 'What does Redux help with?', '["State management", "Routing", "Styling", "Testing"]', 'State management', 'Redux is a predictable state container for JavaScript apps, commonly used with React.', 'active'),
('60000000-0000-0000-0000-010102000004', '50000000-0000-0000-0000-030400000002', 'simple', 'code_mcq', 'What does this return? React.memo(MyComponent)', '["A memoized component", "A stateful component", "An error", "A hook"]', 'A memoized component', 'React.memo is a higher-order component that memoizes the result, preventing re-renders if props haven''t changed.', 'active'),

-- Intermediate Questions (4)
('60000000-0000-0000-0000-010102000005', '50000000-0000-0000-0000-030400000002', 'intermediate', 'mcq', 'What is the purpose of useCallback?', '["Memoize functions", "Memoize values", "Handle side effects", "Manage state"]', 'Memoize functions', 'useCallback returns a memoized version of a callback function that only changes if dependencies change.', 'active'),
('60000000-0000-0000-0000-010102000006', '50000000-0000-0000-0000-030400000002', 'intermediate', 'mcq', 'What is code splitting?', '["Splitting code into smaller bundles", "Dividing components", "Separating CSS", "Splitting state"]', 'Splitting code into smaller bundles', 'Code splitting allows splitting code into smaller bundles that can be loaded on demand.', 'active'),
('60000000-0000-0000-0000-010102000007', '50000000-0000-0000-0000-030400000002', 'intermediate', 'mcq', 'What is server-side rendering (SSR)?', '["Rendering React on the server", "Rendering on CDN", "Client rendering", "Static generation"]', 'Rendering React on the server', 'SSR renders React components on the server and sends HTML to the client.', 'active'),
('60000000-0000-0000-0000-010102000008', '50000000-0000-0000-0000-030400000002', 'intermediate', 'code_mcq', 'What pattern is this? const { data, error } = useSWR(''/api/user'');

', '["Data fetching", "State management", "Event handling", "Form validation"]', 'Data fetching', 'This shows the useSWR hook pattern for data fetching with caching and revalidation.', 'active'),

-- Expert Questions (5)
('60000000-0000-0000-0000-010102000009', '50000000-0000-0000-0000-030400000002', 'expert', 'mcq', 'What is concurrent mode?', '["A set of features for responsive apps", "A rendering mode", "A state management", "A testing strategy"]', 'A set of features for responsive apps', 'Concurrent mode helps apps stay responsive by rendering without blocking the main thread.', 'active'),
('60000000-0000-0000-0000-010102000010', '50000000-0000-0000-0000-030400000002', 'expert', 'mcq', 'What are error boundaries?', '["Components that catch JavaScript errors", "Error handling functions", "try-catch blocks", "Debug tools"]', 'Components that catch JavaScript errors', 'Error boundaries are React components that catch JavaScript errors anywhere in their child component tree.', 'active'),
('60000000-0000-0000-0000-010102000011', '50000000-0000-0000-0000-030400000002', 'expert', 'code_mcq', 'What does React.lazy() enable?', '["Code splitting", "Lazy loading", "Both A and B", "Neither"]', 'Both A and B', 'React.lazy() enables code splitting and lazy loading of components.', 'active'),
('60000000-0000-0000-0000-010102000012', '50000000-0000-0000-0000-030400000002', 'expert', 'mcq', 'What is the purpose of useTransition?', '["Mark state updates as non-urgent", "Handle animations", "Manage transitions", "Control rendering"]', 'Mark state updates as non-urgent', 'useTransition marks state updates as non-urgent, allowing interruptions for more urgent updates.', 'active'),
('60000000-0000-0000-0000-010102000013', '50000000-0000-0000-0000-030400000002', 'expert', 'mcq', 'What is React Server Components?', '["Components that render on the server", "Client components", "Hybrid components", "Legacy components"]', 'Components that render on the server', 'React Server Components allow rendering components on the server to reduce bundle size.', 'active');

-- ============================================
-- SUBJECT 2: Backend Development (Node.js)
-- ============================================

-- 7. CREATE SUBJECT: Node.js
INSERT INTO subjects (id, domain_id, name, status) 
VALUES ('40000000-0000-0000-0000-030000000002', '30000000-0000-0000-0000-000000000002', 'Node.js', 'active');

-- 8. CREATE TOPIC 3: Node.js Core
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000003', '40000000-0000-0000-0000-030000000002', 'Node.js Core', 'active');

-- 9. CREATE QUESTIONS FOR TOPIC 3 (13 questions)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
-- Simple Questions (4)
('60000000-0000-0000-0000-010201000001', '50000000-0000-0000-0000-030400000003', 'simple', 'mcq', 'What is Node.js?', '["JavaScript runtime", "Web framework", "Database", "Browser"]', 'JavaScript runtime', 'Node.js is a JavaScript runtime built on Chrome''s V8 JavaScript engine.', 'active'),
('60000000-0000-0000-0000-010201000002', '50000000-0000-0000-0000-030400000003', 'simple', 'mcq', 'Which module is built-in for file operations?', '["fs", "http", "path", "url"]', 'fs', 'The fs module provides an API for interacting with the file system.', 'active'),
('60000000-0000-0000-0000-010201000003', '50000000-0000-0000-0000-030400000003', 'simple', 'mcq', 'What does require() do?', '["Imports modules", "Exports modules", "Requires permissions", "Checks existence"]', 'Imports modules', 'require() is used to import modules in CommonJS.', 'active'),
('60000000-0000-0000-0000-010201000004', '50000000-0000-0000-0000-030400000003', 'simple', 'code_mcq', 'What does process.argv contain?', '["Command-line arguments", "Environment variables", "Process ID", "Current directory"]', 'Command-line arguments', 'process.argv returns an array containing the command-line arguments.', 'active'),

-- Intermediate Questions (4)
('60000000-0000-0000-0000-010201000005', '50000000-0000-0000-0000-030400000003', 'intermediate', 'mcq', 'What is the event loop?', '["Mechanism that handles async operations", "Event handler", "Loop construct", "Timer"]', 'Mechanism that handles async operations', 'The event loop is what allows Node.js to perform non-blocking I/O operations.', 'active'),
('60000000-0000-0000-0000-010201000006', '50000000-0000-0000-0000-030400000003', 'intermediate', 'mcq', 'What is libuv?', '["Multiplatform C library", "JavaScript library", "Package manager", "Testing framework"]', 'Multiplatform C library', 'libuv is a multi-platform C library that provides support for asynchronous I/O.', 'active'),
('60000000-0000-0000-0000-010201000007', '50000000-0000-0000-0000-030400000003', 'intermediate', 'mcq', 'What does setImmediate() do?', '["Executes after I/O callbacks", "Executes immediately", "Sets timeout", "Clears queue"]', 'Executes after I/O callbacks', 'setImmediate() schedules a callback to be executed after I/O callbacks.', 'active'),
('60000000-0000-0000-0000-010201000008', '50000000-0000-0000-0000-030400000003', 'intermediate', 'code_mcq', 'What is this pattern? const { spawn } = require(''child_process'');

', '["Spawning child processes", "Creating threads", "Forking processes", "Clustering"]', 'Spawning child processes', 'This shows how to spawn child processes in Node.js using the child_process module.', 'active'),

-- Expert Questions (5)
('60000000-0000-0000-0000-010201000009', '50000000-0000-0000-0000-030400000003', 'expert', 'mcq', 'What is the difference between require() and import?', '["Synchronous vs asynchronous", "CommonJS vs ES6", "Both A and B", "Neither"]', 'Both A and B', 'require() is synchronous CommonJS, while import is asynchronous ES6 modules.', 'active'),
('60000000-0000-0000-0000-010201000010', '50000000-0000-0000-0000-030400000003', 'expert', 'mcq', 'What are worker threads?', '["Run JavaScript in parallel", "Child processes", "Web workers", "Thread pool"]', 'Run JavaScript in parallel', 'Worker threads allow running JavaScript in parallel using separate threads.', 'active'),
('60000000-0000-0000-0000-010201000011', '50000000-0000-0000-0000-030400000003', 'expert', 'mcq', 'What is the purpose of --inspect flag?', '["Enable debugger", "Inspect modules", "Check memory", "Profile CPU"]', 'Enable debugger', '--inspect enables the Node.js debugger protocol.', 'active'),
('60000000-0000-0000-0000-010201000012', '50000000-0000-0000-0000-030400000003', 'expert', 'code_mcq', 'What does Buffer.alloc(10) create?', '["10-byte buffer", "10-character string", "10-element array", "10MB memory"]', '10-byte buffer', 'Buffer.alloc() creates a new buffer of the specified size.', 'active'),
('60000000-0000-0000-0000-010201000013', '50000000-0000-0000-0000-030400000003', 'expert', 'mcq', 'What is the module wrapper function?', '["Wraps module code", "Exports wrapper", "Require function", "Import wrapper"]', 'Wraps module code', 'Node.js wraps module code in a function for isolation.', 'active');

-- 10. CREATE TOPIC 4: Express.js & APIs
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000004', '40000000-0000-0000-0000-030000000002', 'Express.js & APIs', 'active');

-- 11. CREATE QUESTIONS FOR TOPIC 4 (13 questions)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
-- Simple Questions (4)
('60000000-0000-0000-0000-010202000001', '50000000-0000-0000-0000-030400000004', 'simple', 'mcq', 'What is Express.js?', '["Web framework for Node.js", "Template engine", "Database ORM", "Testing framework"]', 'Web framework for Node.js', 'Express is a minimal and flexible Node.js web application framework.', 'active'),
('60000000-0000-0000-0000-010202000002', '50000000-0000-0000-0000-030400000004', 'simple', 'mcq', 'What does app.use() do?', '["Mounts middleware", "Defines routes", "Starts server", "Configures views"]', 'Mounts middleware', 'app.use() mounts middleware functions at the specified path.', 'active'),
('60000000-0000-0000-0000-010202000003', '50000000-0000-0000-0000-030400000004', 'simple', 'mcq', 'How do you define a GET route?', '["app.get()", "app.route()", "app.GET()", "app.use()"]', 'app.get()', 'app.get() defines a route for handling GET requests.', 'active'),
('60000000-0000-0000-0000-010202000004', '50000000-0000-0000-0000-030400000004', 'simple', 'code_mcq', 'What does this return? res.json({ success: true })', '["JSON response", "HTML response", "Text response", "File response"]', 'JSON response', 'res.json() sends a JSON response with proper Content-Type header.', 'active'),

-- Intermediate Questions (4)
('60000000-0000-0000-0000-010202000005', '50000000-0000-0000-0000-030400000004', 'intermediate', 'mcq', 'What is middleware in Express?', '["Functions that have access to req, res, and next", "Route handlers", "Error handlers", "Template engines"]', 'Functions that have access to req, res, and next', 'Middleware functions can execute code, modify req/res objects, and call next().', 'active'),
('60000000-0000-0000-0000-010202000006', '50000000-0000-0000-0000-030400000004', 'intermediate', 'mcq', 'What is CORS middleware for?', '["Handle cross-origin requests", "Compress responses", "Parse cookies", "Log requests"]', 'Handle cross-origin requests', 'CORS middleware enables Cross-Origin Resource Sharing.', 'active'),
('60000000-0000-0000-0000-010202000007', '50000000-0000-0000-0000-030400000004', 'intermediate', 'mcq', 'What is the purpose of helmet.js?', '["Security headers", "Compression", "Rate limiting", "Validation"]', 'Security headers', 'helmet.js helps secure Express apps by setting various HTTP headers.', 'active'),
('60000000-0000-0000-0000-010202000008', '50000000-0000-0000-0000-030400000004', 'intermediate', 'code_mcq', 'What does this handle? app.use((err, req, res, next) => {...})', '["Error handling middleware", "Route middleware", "Authentication", "Validation"]', 'Error handling middleware', 'Four-parameter functions are error-handling middleware in Express.', 'active'),

-- Expert Questions (5)
('60000000-0000-0000-0000-010202000009', '50000000-0000-0000-0000-030400000004', 'expert', 'mcq', 'What is the purpose of express.Router()?', '["Create modular route handlers", "Handle errors", "Configure middleware", "Start server"]', 'Create modular route handlers', 'express.Router() creates modular, mountable route handlers.', 'active'),
('60000000-0000-0000-0000-010202000010', '50000000-0000-0000-0000-030400000004', 'expert', 'mcq', 'What is JWT used for?', '["Authentication", "Authorization", "Both A and B", "Neither"]', 'Both A and B', 'JWTs are used for both authentication and authorization.', 'active'),
('60000000-0000-0000-0000-010202000011', '50000000-0000-0000-0000-030400000004', 'expert', 'mcq', 'What is rate limiting?', '["Limit requests from an IP", "Limit bandwidth", "Limit connections", "Limit memory"]', 'Limit requests from an IP', 'Rate limiting controls how many requests a client can make in a given time.', 'active'),
('60000000-0000-0000-0000-010202000012', '50000000-0000-0000-0000-030400000004', 'expert', 'code_mcq', 'What pattern is this? const pool = new Pool({ connectionString });

', '["Connection pooling", "Singleton pattern", "Factory pattern", "Observer pattern"]', 'Connection pooling', 'This shows database connection pooling with node-postgres.', 'active'),
('60000000-0000-0000-0000-010202000013', '50000000-0000-0000-0000-030400000004', 'expert', 'mcq', 'What is the purpose of express.static()?', '["Serve static files", "Handle dynamic routes", "Parse form data", "Set cookies"]', 'Serve static files', 'express.static() serves static files like images, CSS, JavaScript.', 'active');

-- ============================================
-- SUBJECT 3: Database Systems (MongoDB & SQL)
-- ============================================

-- 12. CREATE SUBJECT: Database Systems
INSERT INTO subjects (id, domain_id, name, status) 
VALUES ('40000000-0000-0000-0000-030000000003', '30000000-0000-0000-0000-000000000002', 'Database Systems', 'active');

-- 13. CREATE TOPIC 5: MongoDB
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000005', '40000000-0000-0000-0000-030000000003', 'MongoDB', 'active');

-- 14. CREATE QUESTIONS FOR TOPIC 5 (13 questions)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
-- Simple Questions (4)
('60000000-0000-0000-0000-010301000001', '50000000-0000-0000-0000-030400000005', 'simple', 'mcq', 'What type of database is MongoDB?', '["NoSQL", "SQL", "Graph", "Key-value"]', 'NoSQL', 'MongoDB is a document-based NoSQL database.', 'active'),
('60000000-0000-0000-0000-010301000002', '50000000-0000-0000-0000-030400000005', 'simple', 'mcq', 'What is a collection in MongoDB?', '["Group of documents", "Table", "Schema", "Database"]', 'Group of documents', 'A collection is equivalent to a table in SQL, containing documents.', 'active'),
('60000000-0000-0000-0000-010301000003', '50000000-0000-0000-0000-030400000005', 'simple', 'mcq', 'What is a document in MongoDB?', '["BSON object", "JSON object", "XML object", "CSV row"]', 'BSON object', 'Documents are stored as BSON (Binary JSON) objects.', 'active'),
('60000000-0000-0000-0000-010301000004', '50000000-0000-0000-0000-030400000005', 'simple', 'code_mcq', 'What does db.collection.find() return?', '["Cursor to documents", "Array of documents", "Single document", "Count"]', 'Cursor to documents', 'find() returns a cursor that can be iterated to access documents.', 'active'),

-- Intermediate Questions (4)
('60000000-0000-0000-0000-010301000005', '50000000-0000-0000-0000-030400000005', 'intermediate', 'mcq', 'What is the purpose of indexes in MongoDB?', '["Improve query performance", "Enforce uniqueness", "Both A and B", "Neither"]', 'Both A and B', 'Indexes improve query performance and can enforce uniqueness constraints.', 'active'),
('60000000-0000-0000-0000-010301000006', '50000000-0000-0000-0000-030400000005', 'intermediate', 'mcq', 'What is aggregation in MongoDB?', '["Data processing pipeline", "Data migration", "Backup process", "Replication"]', 'Data processing pipeline', 'Aggregation processes data records and returns computed results.', 'active'),
('60000000-0000-0000-0000-010301000007', '50000000-0000-0000-0000-030400000005', 'intermediate', 'mcq', 'What is sharding?', '["Horizontal partitioning", "Vertical partitioning", "Replication", "Backup"]', 'Horizontal partitioning', 'Sharding distributes data across multiple machines.', 'active'),
('60000000-0000-0000-0000-010301000008', '50000000-0000-0000-0000-030400000005', 'intermediate', 'code_mcq', 'What does this update? db.users.updateOne({age: {$gt: 18}}, {$set: {adult: true}})', '["Updates first matching document", "Updates all documents", "Inserts document", "Deletes document"]', 'Updates first matching document', 'updateOne() updates the first document that matches the filter.', 'active'),

-- Expert Questions (5)
('60000000-0000-0000-0000-010301000009', '50000000-0000-0000-0000-030400000005', 'expert', 'mcq', 'What is a replica set?', '["Group of mongod instances", "Backup set", "Shard set", "Index set"]', 'Group of mongod instances', 'A replica set provides redundancy and high availability.', 'active'),
('60000000-0000-0000-0000-010301000010', '50000000-0000-0000-0000-030400000005', 'expert', 'mcq', 'What is the oplog?', '["Operations log", "Optimization log", "Output log", "Object log"]', 'Operations log', 'The oplog records all operations that modify data.', 'active'),
('60000000-0000-0000-0000-010301000011', '50000000-0000-0000-0000-030400000005', 'expert', 'mcq', 'What is MongoDB Atlas?', '["Cloud database service", "Desktop client", "CLI tool", "ORM"]', 'Cloud database service', 'MongoDB Atlas is a fully-managed cloud database service.', 'active'),
('60000000-0000-0000-0000-010301000012', '50000000-0000-0000-0000-030400000005', 'expert', 'code_mcq', 'What does $lookup stage do in aggregation?', '["Performs left outer join", "Filters documents", "Groups documents", "Sorts documents"]', 'Performs left outer join', '$lookup performs a left outer join between collections.', 'active'),
('60000000-0000-0000-0000-010301000013', '50000000-0000-0000-0000-030400000005', 'expert', 'mcq', 'What is change streams?', '["Real-time data changes", "Stream processing", "Data migration", "Backup streams"]', 'Real-time data changes', 'Change streams allow applications to access real-time data changes.', 'active');

-- 15. CREATE TOPIC 6: PostgreSQL
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000006', '40000000-0000-0000-0000-030000000003', 'PostgreSQL', 'active');

-- 16. CREATE QUESTIONS FOR TOPIC 6 (12 questions to reach 100 total)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
-- Simple Questions (4)
('60000000-0000-0000-0000-010302000001', '50000000-0000-0000-0000-030400000006', 'simple', 'mcq', 'What type of database is PostgreSQL?', '["Relational", "NoSQL", "Document", "Graph"]', 'Relational', 'PostgreSQL is a powerful, open-source relational database.', 'active'),
('60000000-0000-0000-0000-010302000002', '50000000-0000-0000-0000-030400000006', 'simple', 'mcq', 'What is a primary key?', '["Unique identifier for a row", "Foreign key", "Index", "Constraint"]', 'Unique identifier for a row', 'A primary key uniquely identifies each row in a table.', 'active'),
('60000000-0000-0000-0000-010302000003', '50000000-0000-0000-0000-030400000006', 'simple', 'mcq', 'What does SQL stand for?', '["Structured Query Language", "Simple Query Language", "Standard Query Language", "System Query Language"]', 'Structured Query Language', 'SQL is the standard language for relational databases.', 'active'),
('60000000-0000-0000-0000-010302000004', '50000000-0000-0000-0000-030400000006', 'simple', 'code_mcq', 'What does SELECT * FROM users WHERE age > 18;

return?', '["All users over 18", "First user over 18", "Count of users", "Users table"]', 'All users over 18', 'This query returns all rows where age is greater than 18.', 'active'),

-- Intermediate Questions (4)
('60000000-0000-0000-0000-010302000005', '50000000-0000-0000-0000-030400000006', 'intermediate', 'mcq', 'What is a JOIN used for?', '["Combine rows from multiple tables", "Filter rows", "Sort rows", "Group rows"]', 'Combine rows from multiple tables', 'JOIN combines columns from one or more tables.', 'active'),
('60000000-0000-0000-0000-010302000006', '50000000-0000-0000-0000-030400000006', 'intermediate', 'mcq', 'What is a transaction?', '["Sequence of operations", "Single operation", "Table operation", "Database operation"]', 'Sequence of operations', 'A transaction is a sequence of operations performed as a single unit.', 'active'),
('60000000-0000-0000-0000-010302000007', '50000000-0000-0000-0000-030400000006', 'intermediate', 'mcq', 'What is ACID compliance?', '["Atomicity, Consistency, Isolation, Durability", "Availability, Consistency, Integrity, Durability", "Atomicity, Consistency, Integrity, Durability", "Availability, Consistency, Isolation, Durability"]', 'Atomicity, Consistency, Isolation, Durability', 'ACID ensures reliable processing of database transactions.', 'active'),
('60000000-0000-0000-0000-010302000008', '50000000-0000-0000-0000-030400000006', 'intermediate', 'code_mcq', 'What does CREATE INDEX idx_name ON users (name);

do?', '["Creates index on name column", "Creates table", "Creates view", "Creates constraint"]', 'Creates index on name column', 'This creates an index to improve queries on the name column.', 'active'),

-- Expert Questions (4 - adjusted to reach exactly 100 questions)
('60000000-0000-0000-0000-010302000009', '50000000-0000-0000-0000-030400000006', 'expert', 'mcq', 'What are materialized views?', '["Precomputed query results", "Virtual tables", "Temporary tables", "Indexed views"]', 'Precomputed query results', 'Materialized views store query results physically for faster access.', 'active'),
('60000000-0000-0000-0000-010302000010', '50000000-0000-0000-0000-030400000006', 'expert', 'mcq', 'What is MVCC?', '["Multi-version concurrency control", "Multi-value concurrency control", "Multi-version consistency control", "Multi-value consistency control"]', 'Multi-version concurrency control', 'MVCC allows concurrent access without locking.', 'active'),
('60000000-0000-0000-0000-010302000011', '50000000-0000-0000-0000-030400000006', 'expert', 'mcq', 'What are window functions?', '["Perform calculations across rows", "Window operations", "Windowing functions", "Frame functions"]', 'Perform calculations across rows', 'Window functions perform calculations across related rows.', 'active'),
('60000000-0000-0000-0000-010302000012', '50000000-0000-0000-0000-030400000006', 'expert', 'code_mcq', 'What does WITH RECURSIVE enable?', '["Recursive queries", "Temporary tables", "Common table expressions", "All of the above"]', 'Recursive queries', 'WITH RECURSIVE enables recursive common table expressions.', 'active');

-- ============================================
-- SUBJECT 4: Modern Web Technologies
-- ============================================

-- 17. CREATE SUBJECT: Modern Web Technologies
INSERT INTO subjects (id, domain_id, name, status) 
VALUES ('40000000-0000-0000-0000-030000000004', '30000000-0000-0000-0000-000000000002', 'Modern Web Technologies', 'active');

-- 18. CREATE TOPIC 7: TypeScript
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000007', '40000000-0000-0000-0000-030000000004', 'TypeScript', 'active');

-- 19. CREATE QUESTIONS FOR TOPIC 7 (12 questions)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
-- Simple Questions (4)
('60000000-0000-0000-0000-010302000013', '50000000-0000-0000-0000-030400000007', 'simple', 'mcq', 'What is TypeScript?', '["Typed superset of JavaScript", "New programming language", "JavaScript framework", "Database language"]', 'Typed superset of JavaScript', 'TypeScript adds static typing to JavaScript.', 'active'),
('60000000-0000-0000-0000-010401000001', '50000000-0000-0000-0000-030400000007', 'simple', 'mcq', 'What file extension does TypeScript use?', '[".ts", ".js", ".tsx", ".jsx"]', '.ts', 'TypeScript files use .ts extension.', 'active'),
('60000000-0000-0000-0000-010401000002', '50000000-0000-0000-0000-030400000007', 'simple', 'mcq', 'What does tsc do?', '["TypeScript compiler", "TypeScript checker", "TypeScript server", "TypeScript bundler"]', 'TypeScript compiler', 'tsc compiles TypeScript to JavaScript.', 'active'),
('60000000-0000-0000-0000-010401000003', '50000000-0000-0000-0000-030400000007', 'simple', 'code_mcq', 'What does this define? const name: string = "John";

', '["Variable with string type", "Variable with any type", "Constant function", "Type alias"]', 'Variable with string type', 'This defines a constant variable with string type annotation.', 'active'),

-- Intermediate Questions (4)
('60000000-0000-0000-0000-010401000004', '50000000-0000-0000-0000-030400000007', 'intermediate', 'mcq', 'What is an interface?', '["Contract for object shape", "Type definition", "Class definition", "Function definition"]', 'Contract for object shape', 'Interfaces define the structure of objects.', 'active'),
('60000000-0000-0000-0000-010401000005', '50000000-0000-0000-0000-030400000007', 'intermediate', 'mcq', 'What are generics?', '["Type parameters", "Generic functions", "Template types", "All of the above"]', 'All of the above', 'Generics create reusable components that work with multiple types.', 'active'),
('60000000-0000-0000-0000-010401000006', '50000000-0000-0000-0000-030400000007', 'intermediate', 'mcq', 'What is type inference?', '["Automatic type detection", "Manual type annotation", "Type checking", "Type conversion"]', 'Automatic type detection', 'TypeScript can infer types without explicit annotations.', 'active'),
('60000000-0000-0000-0000-010401000007', '50000000-0000-0000-0000-030400000007', 'intermediate', 'code_mcq', 'What does Partial<T> do?', '["Makes all properties optional", "Makes all properties required", "Makes properties readonly", "Omits properties"]', 'Makes all properties optional', 'Partial<T> constructs a type with all properties of T set to optional.', 'active'),

-- Expert Questions (4)
('60000000-0000-0000-0000-010401000008', '50000000-0000-0000-0000-030400000007', 'expert', 'mcq', 'What are conditional types?', '["Types that depend on conditions", "If-else for types", "Type guards", "Type predicates"]', 'Types that depend on conditions', 'Conditional types select types based on conditions.', 'active'),
('60000000-0000-0000-0000-010401000009', '50000000-0000-0000-0000-030400000007', 'expert', 'mcq', 'What is declaration merging?', '["Merging multiple declarations", "Combining interfaces", "Extending types", "All of the above"]', 'All of the above', 'TypeScript can merge multiple declarations of the same name.', 'active'),
('60000000-0000-0000-0000-010401000010', '50000000-0000-0000-0000-030400000007', 'expert', 'mcq', 'What are mapped types?', '["Create new types by transforming properties", "Map functions", "Type mappings", "Property maps"]', 'Create new types by transforming properties', 'Mapped types create new types based on old ones by transforming properties.', 'active'),
('60000000-0000-0000-0000-010401000011', '50000000-0000-0000-0000-030400000007', 'expert', 'code_mcq', 'What does keyof T return?', '["Union of keys of T", "Type of keys", "Array of keys", "String of keys"]', 'Union of keys of T', 'keyof T returns a union type of the keys of type T.', 'active');

-- 20. CREATE TOPIC 8: Web Performance & Security
INSERT INTO topics (id, subject_id, name, status) 
VALUES ('50000000-0000-0000-0000-030400000008', '40000000-0000-0000-0000-030000000004', 'Web Performance & Security', 'active');

-- 21. CREATE FINAL QUESTIONS FOR TOPIC 8 (12 questions to complete 100)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, status) VALUES
-- Simple Questions (4)
('60000000-0000-0000-0000-010401000012', '50000000-0000-0000-0000-030400000008', 'simple', 'mcq', 'What does CDN stand for?', '["Content Delivery Network", "Content Distribution Network", "Content Data Network", "Content Delivery Node"]', 'Content Delivery Network', 'CDNs distribute content geographically for faster delivery.', 'active'),
('60000000-0000-0000-0000-010401000013', '50000000-0000-0000-0000-030400000008', 'simple', 'mcq', 'What is lazy loading?', '["Loading resources when needed", "Loading all resources", "Loading on scroll", "Loading after page load"]', 'Loading resources when needed', 'Lazy loading defers loading of non-critical resources.', 'active'),
('60000000-0000-0000-0000-010402000001', '50000000-0000-0000-0000-030400000008', 'simple', 'mcq', 'What is XSS?', '["Cross-Site Scripting", "Cross-Site Security", "XML Site Scripting", "XHTML Site Scripting"]', 'Cross-Site Scripting', 'XSS allows attackers to inject malicious scripts.', 'active'),
('60000000-0000-0000-0000-010402000002', '50000000-0000-0000-0000-030400000008', 'simple', 'code_mcq', 'What does Cache-Control: max-age=3600 specify?', '["Cache for 1 hour", "Cache for 3600 hours", "No cache", "Cache validation"]', 'Cache for 1 hour', 'max-age=3600 means the resource can be cached for 3600 seconds (1 hour).', 'active'),

-- Intermediate Questions (4)
('60000000-0000-0000-0000-010402000003', '50000000-0000-0000-0000-030400000008', 'intermediate', 'mcq', 'What is tree shaking?', '["Removing unused code", "Shaking dependency tree", "Tree optimization", "Code splitting"]', 'Removing unused code', 'Tree shaking eliminates dead code during bundling.', 'active'),
('60000000-0000-0000-0000-010402000004', '50000000-0000-0000-0000-030400000008', 'intermediate', 'mcq', 'What is CORS?', '["Cross-Origin Resource Sharing", "Cross-Origin Request Security", "Cross-Origin Response Security", "Cross-Origin Resource Security"]', 'Cross-Origin Resource Sharing', 'CORS allows controlled access to resources from different origins.', 'active'),
('60000000-0000-0000-0000-010402000005', '50000000-0000-0000-0000-030400000008', 'intermediate', 'mcq', 'What is a CSRF token?', '["Prevents cross-site request forgery", "Authenticates users", "Encrypts data", "Validates forms"]', 'Prevents cross-site request forgery', 'CSRF tokens protect against unauthorized commands from users.', 'active'),
('60000000-0000-0000-0000-010402000006', '50000000-0000-0000-0000-030400000008', 'intermediate', 'code_mcq', 'What does Content-Security-Policy header do?', '["Controls resources", "Sets cookies", "Compresses content", "Redirects requests"]', 'Controls resources', 'CSP controls which resources can be loaded to prevent XSS.', 'active'),

-- Expert Questions (4 - final questions)
('60000000-0000-0000-0000-010402000007', '50000000-0000-0000-0000-030400000008', 'expert', 'mcq', 'What is HSTS?', '["HTTP Strict Transport Security", "HTTP Secure Transport Security", "HTTP Strict Transfer Security", "HTTP Secure Transfer Security"]', 'HTTP Strict Transport Security', 'HSTS forces browsers to use HTTPS only.', 'active'),
('60000000-0000-0000-0000-010402000008', '50000000-0000-0000-0000-030400000008', 'expert', 'mcq', 'What are service workers?', '["Proxy between browser and network", "Web workers", "Background scripts", "JavaScript files"]', 'Proxy between browser and network', 'Service workers enable offline functionality and background sync.', 'active'),
('60000000-0000-0000-0000-010402000009', '50000000-0000-0000-0000-030400000008', 'expert', 'mcq', 'What is WebAssembly?', '["Binary instruction format", "JavaScript extension", "Web framework", "Markup language"]', 'Binary instruction format', 'WebAssembly enables near-native performance in web apps.', 'active'),
('60000000-0000-0000-0000-010402000010', '50000000-0000-0000-0000-030400000008', 'expert', 'code_mcq', 'What does Lighthouse measure?', '["Web performance", "Code quality", "Security score", "All of the above"]', 'All of the above', 'Lighthouse measures performance, accessibility, best practices, and SEO.', 'active');

-- 1. Create the Domain
INSERT INTO domains (id, name, category, status)
VALUES ('30000000-0000-0000-0000-000000000003', 'Data Science', 'Technology', 'active');

-- 2. Create Subjects (Linked to Domain)
INSERT INTO subjects (id, domain_id, name, status)
VALUES ('40000000-0000-0000-0000-030000000001', '30000000-0000-0000-0000-000000000003', 'Data Preparation', 'active');

INSERT INTO subjects (id, domain_id, name, status)
VALUES ('40000000-0000-0000-0000-030000000002', '30000000-0000-0000-0000-000000000003', 'Machine Learning Fundamentals', 'active');

INSERT INTO subjects (id, domain_id, name, status)
VALUES ('40000000-0000-0000-0000-030000000003', '30000000-0000-0000-0000-000000000003', 'Advanced Machine Learning', 'active');

INSERT INTO subjects (id, domain_id, name, status)
VALUES ('40000000-0000-0000-0000-030000000004', '30000000-0000-0000-0000-000000000003', 'Data Analysis and Visualization', 'active');

-- 3. Create Topics (Linked to Subjects)
-- Subject 1: Data Preparation
INSERT INTO topics (id, subject_id, name, status)
VALUES ('50000000-0000-0000-0000-030400000001', '40000000-0000-0000-0000-030000000001', 'Data Cleaning', 'active');

INSERT INTO topics (id, subject_id, name, status)
VALUES ('50000000-0000-0000-0000-030400000002', '40000000-0000-0000-0000-030000000001', 'Feature Engineering', 'active');

-- Subject 2: Machine Learning Fundamentals
INSERT INTO topics (id, subject_id, name, status)
VALUES ('50000000-0000-0000-0000-030400000003', '40000000-0000-0000-0000-030000000002', 'Regression', 'active');

INSERT INTO topics (id, subject_id, name, status)
VALUES ('50000000-0000-0000-0000-030400000004', '40000000-0000-0000-0000-030000000002', 'Classification', 'active');

-- Subject 3: Advanced Machine Learning
INSERT INTO topics (id, subject_id, name, status)
VALUES ('50000000-0000-0000-0000-030400000005', '40000000-0000-0000-0000-030000000003', 'Clustering', 'active');

INSERT INTO topics (id, subject_id, name, status)
VALUES ('50000000-0000-0000-0000-030400000006', '40000000-0000-0000-0000-030000000003', 'Dimensionality Reduction', 'active');

-- Subject 4: Data Analysis and Visualization
INSERT INTO topics (id, subject_id, name, status)
VALUES ('50000000-0000-0000-0000-030400000007', '40000000-0000-0000-0000-030000000004', 'Statistical Inference', 'active');

INSERT INTO topics (id, subject_id, name, status)
VALUES ('50000000-0000-0000-0000-030400000008', '40000000-0000-0000-0000-030000000004', 'Visualization Techniques', 'active');

-- 4. Create Questions (Linked to Topics)
-- Topic 1: Data Cleaning (13 questions: 4 simple, 4 intermediate, 5 expert)
INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000001', 'simple', 'mcq', 'What is the primary goal of data cleaning?', '["To make data visually appealing", "To remove or correct errors in data", "To increase data volume", "To encrypt data"]', 'To remove or correct errors in data', 'Data cleaning involves identifying and correcting inaccuracies to ensure reliable analysis.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000001', 'simple', 'mcq', 'Which Python library is commonly used for handling missing values?', '["NumPy", "Pandas", "Matplotlib", "Seaborn"]', 'Pandas', 'Pandas provides functions like dropna() and fillna() for missing values.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000001', 'simple', 'code_mcq', 'What does this code do? df.dropna()', '["Removes rows with missing values", "Fills missing values", "Duplicates rows", "Sorts the dataframe"]', 'Removes rows with missing values', 'dropna() removes rows or columns with NaN values.', 'import pandas as pd\ndf = pd.DataFrame({"A": [1, None, 3]})', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000001', 'simple', 'mcq', 'What is a common method to handle outliers?', '["Ignore them", "Remove or cap them", "Multiply them", "Encrypt them"]', 'Remove or cap them', 'Outliers can be removed or capped to prevent skewing results.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000001', 'intermediate', 'mcq', 'How can you detect duplicate rows in a Pandas DataFrame?', '["df.unique()", "df.duplicated()", "df.distinct()", "df.repeat()"]', 'df.duplicated()', 'duplicated() returns a boolean series indicating duplicates.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000001', 'intermediate', 'code_mcq', 'What is the output of df.fillna(0)?', '["Replaces NaN with 0", "Drops NaN", "Counts NaN", "Ignores NaN"]', 'Replaces NaN with 0', 'fillna() replaces missing values with a specified value.', 'import pandas as pd\ndf = pd.DataFrame({"A": [1, None, 3]})', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000001', 'intermediate', 'mcq', 'What does imputation mean in data cleaning?', '["Removing data", "Filling missing values", "Sorting data", "Encrypting data"]', 'Filling missing values', 'Imputation replaces missing data with substituted values.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000001', 'intermediate', 'code_mcq', 'Which method standardizes string cases? str.lower()', '["Converts to lowercase", "Converts to uppercase", "Removes strings", "Duplicates strings"]', 'Converts to lowercase', 'str.lower() normalizes text by converting to lowercase.', 'import pandas as pd\ndf = pd.DataFrame({"Text": ["Hello", "WORLD"]})\ndf["Text"].str.lower()', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000001', 'expert', 'mcq', 'What is the impact of multicollinearity in data cleaning?', '["Improves model accuracy", "Causes unstable coefficients", "Reduces computation time", "Increases data volume"]', 'Causes unstable coefficients', 'Multicollinearity makes it hard to assess individual predictor effects.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000001', 'expert', 'code_mcq', 'How to handle categorical outliers in Pandas?', '["Use IQR method", "Mode imputation", "One-hot encoding first", "Custom frequency thresholds"]', 'Custom frequency thresholds', 'Rare categories can be grouped or thresholded based on frequency.', 'import pandas as pd\ndf["category"].value_counts()', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000001', 'expert', 'mcq', 'What is winsorization?', '["Capping outliers", "Removing duplicates", "Filling NaN", "Normalizing data"]', 'Capping outliers', 'Winsorization limits extreme values to reduce outlier impact.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000001', 'expert', 'code_mcq', 'What does this do for anomaly detection? isolation_forest.fit()', '["Fits a clustering model", "Detects outliers using isolation", "Performs regression", "Visualizes data"]', 'Detects outliers using isolation', 'Isolation Forest isolates anomalies instead of profiling normal points.', 'from sklearn.ensemble import IsolationForest\nisolation_forest = IsolationForest()', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000001', 'expert', 'mcq', 'How does SMOTE handle imbalanced data?', '["Undersampling majority", "Oversampling minority with synthetics", "Removing samples", "Shuffling data"]', 'Oversampling minority with synthetics', 'SMOTE creates synthetic examples for the minority class.', 'active');

-- Topic 2: Feature Engineering (13 questions: 4 simple, 4 intermediate, 5 expert)
INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000002', 'simple', 'mcq', 'What is feature engineering?', '["Creating new features from existing data", "Cleaning data", "Visualizing data", "Training models"]', 'Creating new features from existing data', 'It transforms raw data into features that better represent the problem.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000002', 'simple', 'mcq', 'What is one-hot encoding used for?', '["Converting categorical to numerical", "Scaling numerical features", "Removing outliers", "Filling missing values"]', 'Converting categorical to numerical', 'It creates binary columns for each category.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000002', 'simple', 'code_mcq', 'What does pd.get_dummies() do?', '["Creates dummy variables", "Drops duplicates", "Fills NaN", "Sorts data"]', 'Creates dummy variables', 'It performs one-hot encoding on categorical columns.', 'import pandas as pd\ndf = pd.DataFrame({"Color": ["Red", "Blue"]})', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000002', 'simple', 'mcq', 'Why normalize features?', '["To make them same scale", "To remove them", "To duplicate them", "To encrypt them"]', 'To make them same scale', 'Normalization helps algorithms converge faster.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000002', 'intermediate', 'mcq', 'What is label encoding?', '["Assigning integers to categories", "Creating binary features", "Scaling to 0-1", "Binning continuous"]', 'Assigning integers to categories', 'It converts categories to numerical labels.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000002', 'intermediate', 'code_mcq', 'What is the purpose of MinMaxScaler?', '["Scales to range [0,1]", "Standardizes to mean 0", "Encodes categories", "Bins data"]', 'Scales to range [0,1]', 'It transforms features to a given range.', 'from sklearn.preprocessing import MinMaxScaler', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000002', 'intermediate', 'mcq', 'What is polynomial feature generation?', '["Creating interaction terms", "Removing features", "Scaling features", "Encoding text"]', 'Creating interaction terms', 'It generates higher-degree terms for non-linear relationships.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000002', 'intermediate', 'code_mcq', 'How to create binned features? pd.cut()', '["Divides into intervals", "Cuts rows", "Duplicates bins", "Sorts bins"]', 'Divides into intervals', 'pd.cut() discretizes continuous features into bins.', 'import pandas as pd\npd.cut([1,2,3,4], bins=2)', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000002', 'expert', 'mcq', 'What is target encoding?', '["Encoding categories based on target mean", "One-hot with target", "Label encoding", "Frequency encoding"]', 'Encoding categories based on target mean', 'It replaces categories with the mean target value.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000002', 'expert', 'code_mcq', 'What does PolynomialFeatures(degree=2) generate?', '["Squared and interaction terms", "Only squares", "Linear terms", "Exponential terms"]', 'Squared and interaction terms', 'It creates polynomial and interaction features.', 'from sklearn.preprocessing import PolynomialFeatures', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000002', 'expert', 'mcq', 'How to handle high cardinality in categories?', '["Target encoding or hashing", "One-hot all", "Drop column", "Label encode"]', 'Target encoding or hashing', 'Reduces dimensionality for high unique values.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000002', 'expert', 'code_mcq', 'What is FeatureHasher for?', '["Hashing high-dimensional categoricals", "Scaling features", "Binning", "Polynomial expansion"]', 'Hashing high-dimensional categoricals', 'It applies hash trick for feature vectorization.', 'from sklearn.feature_extraction import FeatureHasher', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000002', 'expert', 'mcq', 'What is interaction feature?', '["Product of two features", "Sum of features", "Difference only", "Ratio only"]', 'Product of two features', 'Captures combined effects between features.', 'active');

-- Topic 3: Regression (13 questions: 4 simple, 4 intermediate, 5 expert)
INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000003', 'simple', 'mcq', 'What does linear regression predict?', '["Continuous values", "Categories", "Clusters", "Associations"]', 'Continuous values', 'It models the relationship between variables for continuous output.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000003', 'simple', 'mcq', 'What is the cost function for linear regression?', '["Mean Squared Error", "Cross-Entropy", "Gini Index", "Entropy"]', 'Mean Squared Error', 'MSE measures the average squared difference between predictions and actuals.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000003', 'simple', 'code_mcq', 'What does LinearRegression().fit() do?', '["Trains the model", "Predicts values", "Scales data", "Encodes labels"]', 'Trains the model', 'fit() estimates the coefficients.', 'from sklearn.linear_model import LinearRegression', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000003', 'simple', 'mcq', 'What is R-squared?', '["Proportion of variance explained", "Error rate", "Accuracy", "Precision"]', 'Proportion of variance explained', 'It indicates how well the model fits the data.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000003', 'intermediate', 'mcq', 'What is ridge regression?', '["L2 regularization", "L1 regularization", "No regularization", "Elastic net"]', 'L2 regularization', 'It adds a penalty to prevent overfitting.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000003', 'intermediate', 'code_mcq', 'What is alpha in Ridge?', '["Regularization strength", "Learning rate", "Batch size", "Epochs"]', 'Regularization strength', 'Higher alpha increases regularization.', 'from sklearn.linear_model import Ridge', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000003', 'intermediate', 'mcq', 'What does lasso do differently from ridge?', '["Feature selection via L1", "L2 penalty", "No penalty", "Both L1 and L2"]', 'Feature selection via L1', 'Lasso can shrink some coefficients to zero.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000003', 'intermediate', 'code_mcq', 'How to evaluate regression? mean_squared_error()', '["Computes MSE", "Computes accuracy", "Computes precision", "Computes recall"]', 'Computes MSE', 'MSE is a common metric for regression.', 'from sklearn.metrics import mean_squared_error', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000003', 'expert', 'mcq', 'What is elastic net?', '["Combination of L1 and L2", "Only L1", "Only L2", "No regularization"]', 'Combination of L1 and L2', 'It balances feature selection and coefficient shrinkage.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000003', 'expert', 'code_mcq', 'What does GridSearchCV optimize for regression?', '["Hyperparameters", "Features", "Data cleaning", "Visualization"]', 'Hyperparameters', 'It searches for best params like alpha.', 'from sklearn.model_selection import GridSearchCV', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000003', 'expert', 'mcq', 'How to handle non-linearity in regression?', '["Polynomial regression or trees", "Linear only", "Remove non-linear", "Ignore"]', 'Polynomial regression or trees', 'Captures complex relationships.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000003', 'expert', 'code_mcq', 'What is the role of learning_rate in GradientBoostingRegressor?', '["Controls step size", "Sets tree depth", "Sets n_estimators", "Sets random state"]', 'Controls step size', 'Shrinks contribution of each tree.', 'from sklearn.ensemble import GradientBoostingRegressor', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000003', 'expert', 'mcq', 'What is heteroscedasticity?', '["Unequal variance in residuals", "Equal variance", "Zero mean residuals", "Normal residuals"]', 'Unequal variance in residuals', 'Violates linear regression assumptions.', 'active');

-- Topic 4: Classification (13 questions: 4 simple, 4 intermediate, 5 expert)
INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000004', 'simple', 'mcq', 'What does logistic regression predict?', '["Probabilities for classes", "Continuous values", "Clusters", "Associations"]', 'Probabilities for classes', 'It uses sigmoid for binary classification.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000004', 'simple', 'mcq', 'What is accuracy in classification?', '["Correct predictions over total", "True positives over predicted positives", "True positives over actual positives", "Harmonic mean of precision and recall"]', 'Correct predictions over total', 'Basic metric for overall performance.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000004', 'simple', 'code_mcq', 'What does LogisticRegression().predict_proba() return?', '["Class probabilities", "Class labels", "Coefficients", "Intercept"]', 'Class probabilities', 'Gives probability estimates.', 'from sklearn.linear_model import LogisticRegression', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000004', 'simple', 'mcq', 'What is a decision tree?', '["Tree-like model for decisions", "Linear model", "Clustering model", "Dimensionality reduction"]', 'Tree-like model for decisions', 'Splits data based on features.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000004', 'intermediate', 'mcq', 'What is precision?', '["True positives over predicted positives", "True positives over actual positives", "Correct over total", "F1 score"]', 'True positives over predicted positives', 'Measures accuracy of positive predictions.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000004', 'intermediate', 'code_mcq', 'What metric is classification_report()?', '["Precision, recall, f1", "Only accuracy", "MSE", "R2"]', 'Precision, recall, f1', 'Provides detailed classification metrics.', 'from sklearn.metrics import classification_report', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000004', 'intermediate', 'mcq', 'What is random forest?', '["Ensemble of decision trees", "Single tree", "Linear ensemble", "SVM ensemble"]', 'Ensemble of decision trees', 'Reduces overfitting by averaging.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000004', 'intermediate', 'code_mcq', 'What does n_estimators control in RandomForestClassifier?', '["Number of trees", "Tree depth", "Learning rate", "Batch size"]', 'Number of trees', 'More trees improve performance but increase computation.', 'from sklearn.ensemble import RandomForestClassifier', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000004', 'expert', 'mcq', 'What is AUC-ROC?', '["Area under receiver operating characteristic", "Accuracy under curve", "Precision-recall area", "F1 curve"]', 'Area under receiver operating characteristic', 'Measures ability to distinguish classes.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000004', 'expert', 'code_mcq', 'How to handle class imbalance? SMOTE()', '["Oversamples minority", "Undersamples majority", "Shuffles data", "Normalizes"]', 'Oversamples minority', 'Creates synthetic samples.', 'from imblearn.over_sampling import SMOTE', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000004', 'expert', 'mcq', 'What is gradient boosting in classification?', '["Sequential trees correcting errors", "Parallel trees", "Single tree", "Linear boosting"]', 'Sequential trees correcting errors', 'Builds models additively.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000004', 'expert', 'code_mcq', 'What is kernel in SVC?', '["Transforms data to higher dimension", "Sets learning rate", "Sets estimators", "Sets depth"]', 'Transforms data to higher dimension', 'Allows non-linear classification.', 'from sklearn.svm import SVC', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000004', 'expert', 'mcq', 'What is focal loss for?', '["Handling imbalance by downweighting easy examples", "Increasing easy examples", "Standard cross-entropy", "MSE for classification"]', 'Handling imbalance by downweighting easy examples', 'Focuses on hard examples.', 'active');

-- Topic 5: Clustering (12 questions: 4 simple, 4 intermediate, 4 expert)
INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000005', 'simple', 'mcq', 'What is clustering?', '["Grouping similar data points", "Predicting labels", "Regressing values", "Classifying categories"]', 'Grouping similar data points', 'Unsupervised learning to find patterns.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000005', 'simple', 'mcq', 'What is K-means?', '["Partitioning into K clusters", "Hierarchical clustering", "Density-based", "Association"]', 'Partitioning into K clusters', 'Assigns points to nearest centroid.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000005', 'simple', 'code_mcq', 'What does KMeans(n_clusters=3).fit() do?', '["Fits 3 clusters", "Predicts 3 labels", "Scales to 3", "Encodes 3"]', 'Fits 3 clusters', 'Learns cluster centers.', 'from sklearn.cluster import KMeans', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000005', 'simple', 'mcq', 'What is elbow method?', '["Finding optimal K by plotting inertia", "Hierarchical dendrogram", "Silhouette score", "Davies-Bouldin"]', 'Finding optimal K by plotting inertia', 'Looks for "elbow" where distortion decreases slowly.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000005', 'intermediate', 'mcq', 'What is hierarchical clustering?', '["Builds tree of clusters", "Partitions fixed K", "Density-based", "Model-based"]', 'Builds tree of clusters', 'Agglomerative or divisive approach.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000005', 'intermediate', 'code_mcq', 'What metric for cluster quality? silhouette_score()', '["Measures cohesion and separation", "Only inertia", "Accuracy", "Precision"]', 'Measures cohesion and separation', 'Higher score indicates better clusters.', 'from sklearn.metrics import silhouette_score', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000005', 'intermediate', 'mcq', 'What is DBSCAN?', '["Density-based clustering", "Centroid-based", "Hierarchical", "Partitioning"]', 'Density-based clustering', 'Groups dense regions, handles noise.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000005', 'intermediate', 'code_mcq', 'What params for DBSCAN? eps, min_samples', '["Radius and min points", "Number of clusters", "Tree depth", "Learning rate"]', 'Radius and min points', 'Defines core points and density.', 'from sklearn.cluster import DBSCAN', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000005', 'expert', 'mcq', 'What is spectral clustering?', '["Graph-based using eigenvalues", "Density-based", "Centroid-based", "Hierarchical"]', 'Graph-based using eigenvalues', 'Uses Laplacian matrix for dimensionality reduction.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000005', 'expert', 'code_mcq', 'How to handle large data in clustering? MiniBatchKMeans', '["Batch processing for K-means", "Full K-means", "Hierarchical", "DBSCAN"]', 'Batch processing for K-means', 'Efficient for large datasets.', 'from sklearn.cluster import MiniBatchKMeans', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000005', 'expert', 'mcq', 'What is the curse of dimensionality in clustering?', '["Distances become meaningless in high dims", "Low dims issue", "Only for K=1", "No impact"]', 'Distances become meaningless in high dims', 'Requires dimensionality reduction.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000005', 'expert', 'code_mcq', 'What does AgglomerativeClustering(linkage="ward") use?', '["Minimizes variance", "Single linkage", "Complete linkage", "Average linkage"]', 'Minimizes variance', 'Ward linkage for hierarchical.', 'from sklearn.cluster import AgglomerativeClustering', 'active');

-- Topic 6: Dimensionality Reduction (12 questions: 4 simple, 4 intermediate, 4 expert)
INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000006', 'simple', 'mcq', 'What is PCA?', '["Principal Component Analysis", "Partial Cluster Analysis", "Predictive Component Analysis", "Partitioning Cluster Algorithm"]', 'Principal Component Analysis', 'Reduces dimensions by finding principal components.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000006', 'simple', 'mcq', 'Why reduce dimensions?', '["To simplify models and visualization", "To increase features", "To add noise", "To encrypt"]', 'To simplify models and visualization', 'Reduces computation and overfitting.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000006', 'simple', 'code_mcq', 'What does PCA(n_components=2).fit_transform() do?', '["Reduces to 2 dimensions", "Fits 2 clusters", "Encodes 2 labels", "Scales to 2"]', 'Reduces to 2 dimensions', 'Projects data onto top 2 PCs.', 'from sklearn.decomposition import PCA', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000006', 'simple', 'mcq', 'What is explained variance in PCA?', '["Variance captured by components", "Total variance", "Error variance", "Residual variance"]', 'Variance captured by components', 'Helps choose number of components.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000006', 'intermediate', 'mcq', 'What is t-SNE?', '["Non-linear dimensionality reduction", "Linear like PCA", "Clustering", "Regression"]', 'Non-linear dimensionality reduction', 'Preserves local structure for visualization.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000006', 'intermediate', 'code_mcq', 'What param in TSNE? perplexity', '["Balances local/global structure", "Number of components", "Learning rate", "Batch size"]', 'Balances local/global structure', 'Related to number of neighbors.', 'from sklearn.manifold import TSNE', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000006', 'intermediate', 'mcq', 'What is LDA in reduction?', '["Linear Discriminant Analysis", "Latent Dirichlet Allocation", "Local Dimensionality Analysis", "Linear Data Analysis"]', 'Linear Discriminant Analysis', 'Supervised reduction maximizing class separation.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000006', 'intermediate', 'code_mcq', 'How to select components in PCA? explained_variance_ratio_', '["Cumulative variance", "Total features", "Error rate", "Accuracy"]', 'Cumulative variance', 'Choose enough to cover desired variance.', 'pca.explained_variance_ratio_', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000006', 'expert', 'mcq', 'What is UMAP?', '["Uniform Manifold Approximation and Projection", "Unified Model Analysis", "Unsupervised Mapping", "Universal Manifold Projection"]', 'Uniform Manifold Approximation and Projection', 'Fast non-linear reduction preserving topology.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000006', 'expert', 'code_mcq', 'What does TruncatedSVD do?', '["SVD for sparse matrices", "Full SVD", "PCA equivalent", "t-SNE"]', 'SVD for sparse matrices', 'Dimensionality reduction for large sparse data.', 'from sklearn.decomposition import TruncatedSVD', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000006', 'expert', 'mcq', 'Difference between PCA and autoencoders?', '["Autoencoders are non-linear neural nets", "PCA is neural", "Both same", "Autoencoders linear"]', 'Autoencoders are non-linear neural nets', 'Autoencoders learn compressed representations.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000006', 'expert', 'code_mcq', 'What is Isomap for?', '["Non-linear manifold learning", "Linear reduction", "Clustering", "Classification"]', 'Non-linear manifold learning', 'Preserves geodesic distances.', 'from sklearn.manifold import Isomap', 'active');

-- Topic 7: Statistical Inference (12 questions: 4 simple, 4 intermediate, 4 expert)
INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000007', 'simple', 'mcq', 'What is a p-value?', '["Probability under null hypothesis", "Probability of alternative", "Error rate", "Confidence level"]', 'Probability under null hypothesis', 'Low p-value rejects null.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000007', 'simple', 'mcq', 'What is hypothesis testing?', '["Testing assumptions about population", "Describing data", "Predicting future", "Clustering"]', 'Testing assumptions about population', 'Uses sample data to infer.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000007', 'simple', 'code_mcq', 'What does scipy.stats.ttest_ind() do?', '["Independent t-test", "Paired t-test", "ANOVA", "Chi-square"]', 'Independent t-test', 'Compares means of two groups.', 'from scipy import stats', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000007', 'simple', 'mcq', 'What is confidence interval?', '["Range likely containing true parameter", "Exact value", "P-value range", "Error interval"]', 'Range likely containing true parameter', 'Provides estimate uncertainty.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000007', 'intermediate', 'mcq', 'What is Type I error?', '["Rejecting true null", "Accepting false null", "Correct rejection", "Correct acceptance"]', 'Rejecting true null', 'False positive.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000007', 'intermediate', 'code_mcq', 'What test for proportions? chi2_contingency()', '["Chi-square test", "T-test", "ANOVA", "Correlation"]', 'Chi-square test', 'For categorical associations.', 'from scipy.stats import chi2_contingency', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000007', 'intermediate', 'mcq', 'What is ANOVA?', '["Analysis of variance for multiple groups", "Two groups only", "Paired data", "Categorical"]', 'Analysis of variance for multiple groups', 'Compares means across groups.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000007', 'intermediate', 'code_mcq', 'How to compute correlation? pearsonr()', '["Pearson correlation", "Spearman", "Kendall", "All"]', 'Pearson correlation', 'Measures linear relationship.', 'from scipy.stats import pearsonr', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000007', 'expert', 'mcq', 'What is multiple testing correction?', '["Adjusting p-values for many tests", "Ignoring multiples", "Summing p-values", "Averaging"]', 'Adjusting p-values for many tests', 'Like Bonferroni to control false positives.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000007', 'expert', 'code_mcq', 'What is statsmodels for inference? ols()', '["Ordinary least squares regression", "Logistic", "Clustering", "PCA"]', 'Ordinary least squares regression', 'For detailed stats inference.', 'from statsmodels.formula.api import ols', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000007', 'expert', 'mcq', 'What is Bayesian inference?', '["Updating beliefs with evidence", "Frequentist only", "P-value based", "Null testing"]', 'Updating beliefs with evidence', 'Uses priors and likelihood.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000007', 'expert', 'code_mcq', 'What test for normality? shapiro()', '["Shapiro-Wilk test", "T-test", "ANOVA", "Chi-square"]', 'Shapiro-Wilk test', 'Tests if data is normally distributed.', 'from scipy.stats import shapiro', 'active');

-- Topic 8: Visualization Techniques (12 questions: 4 simple, 4 intermediate, 4 expert)
INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000008', 'simple', 'mcq', 'What is a histogram?', '["Frequency distribution", "Line plot", "Scatter plot", "Pie chart"]', 'Frequency distribution', 'Shows data distribution.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000008', 'simple', 'mcq', 'What library for plotting in Python?', '["Matplotlib", "Pandas", "NumPy", "SciPy"]', 'Matplotlib', 'Base library for visualizations.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000008', 'simple', 'code_mcq', 'What does plt.scatter() plot?', '["Points", "Lines", "Bars", "Histograms"]', 'Points', 'For relationship between two variables.', 'import matplotlib.pyplot as plt', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000008', 'simple', 'mcq', 'What is a box plot?', '["Shows quartiles and outliers", "Frequency", "Trends over time", "Proportions"]', 'Shows quartiles and outliers', 'Summarizes distribution.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000008', 'intermediate', 'mcq', 'What is seaborn?', '["Statistical visualization library", "Base plotting", "Data manipulation", "ML library"]', 'Statistical visualization library', 'Built on Matplotlib for easier plots.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000008', 'intermediate', 'code_mcq', 'What does sns.heatmap() show?', '["Correlation matrix", "Scatter", "Line", "Bar"]', 'Correlation matrix', 'Visualizes data in grid.', 'import seaborn as sns', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000008', 'intermediate', 'mcq', 'What is pair plot?', '["Scatterplots for pairs of features", "Single scatter", "Histogram only", "Box only"]', 'Scatterplots for pairs of features', 'Shows relationships in dataset.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000008', 'intermediate', 'code_mcq', 'How to plot distributions? sns.distplot()', '["Histogram + KDE", "Only hist", "Only KDE", "Scatter"]', 'Histogram + KDE', 'Shows density estimate.', 'import seaborn as sns', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000008', 'expert', 'mcq', 'What is Plotly for?', '["Interactive visualizations", "Static plots", "Data cleaning", "ML training"]', 'Interactive visualizations', 'Allows zooming, hovering.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000008', 'expert', 'code_mcq', 'What does px.scatter_3d() do?', '["3D scatter plot", "2D scatter", "Line 3D", "Bar 3D"]', '3D scatter plot', 'For multidimensional data.', 'import plotly.express as px', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, status)
VALUES ('50000000-0000-0000-0000-030400000008', 'expert', 'mcq', 'What is dimensionality reduction viz?', '["PCA or t-SNE plots", "Histogram", "Bar chart", "Pie"]', 'PCA or t-SNE plots', 'Visualizes high-dim data in 2D/3D.', 'active');

INSERT INTO questions (topic_id, difficulty, type, question_text, options, correct_answer, explanation, code_snippet, status)
VALUES ('50000000-0000-0000-0000-030400000008', 'expert', 'code_mcq', 'How to create dashboards? dash', '["Interactive web apps", "Static images", "Console output", "Text files"]', 'Interactive web apps', 'Using Plotly Dash for data viz apps.', 'import dash', 'active');