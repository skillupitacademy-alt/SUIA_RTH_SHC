import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('people_user_role', ['student', 'faculty', 'admin', 'super_admin']);
export const platformEnum = pgEnum('people_platform', ['realtutorialhub', 'skillup']);
export const subscriptionPlanEnum = pgEnum('people_subscription_plan', ['free', 'pro', 'enterprise']);
export const subscriptionStatusEnum = pgEnum('people_subscription_status', ['active', 'cancelled', 'expired']);
export const subscriptionFeatureKeyEnum = pgEnum('people_subscription_feature_key', [
  'exam.unlimited',
  'exam.basic',
  'tutorial.full_access',
  'tutorial.preview_only',
  'ai_tutor',
  'certificate',
  'placement_matching',
  'live_sessions',
]);
export const enquirySourceEnum = pgEnum('people_enquiry_source', ['website', 'referral', 'ad', 'walkin']);
export const enquiryStatusEnum = pgEnum('people_enquiry_status', ['new', 'contacted', 'qualified', 'lost']);
export const admissionTypeEnum = pgEnum('people_admission_type', ['digital', 'training']);
export const admissionStatusEnum = pgEnum('people_admission_status', ['pending', 'approved', 'rejected']);
export const facultyAvailabilityTypeEnum = pgEnum('people_faculty_availability_type', ['fulltime', 'parttime', 'contract']);
export const facultyStatusEnum = pgEnum('people_faculty_status', ['active', 'inactive', 'on_leave']);
export const batchModeEnum = pgEnum('people_batch_mode', ['online', 'offline', 'hybrid']);
export const batchStatusEnum = pgEnum('people_batch_status', ['upcoming', 'active', 'completed', 'cancelled']);
export const sessionStatusEnum = pgEnum('people_session_status', ['scheduled', 'completed', 'cancelled']);
export const enrollmentStatusEnum = pgEnum('people_enrollment_status', ['active', 'dropped', 'completed']);
export const attendanceStatusEnum = pgEnum('people_attendance_status', ['present', 'absent', 'late']);
export const demoSessionStatusEnum = pgEnum('people_demo_session_status', ['scheduled', 'completed', 'no_show']);
export const paymentInstallmentStatusEnum = pgEnum('people_payment_installment_status', ['paid', 'due', 'overdue']);
