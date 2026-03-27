import { db as peopleDb, userProfiles } from '@quiz/db-people';
import { certificates, db as tutorialDb, STANDARD_QUERY_TIMEOUT, withTimeout } from '@quiz/db-tutorial';
import { and, eq, isNull } from 'drizzle-orm';
import { PDFDocument, rgb,StandardFonts } from 'pdf-lib';

import { acquireJobLock, releaseJobLock } from '@/lib/job-lock';
import { logger } from '@/lib/logger';
import { storage } from '@/lib/storage';

export type CertificateIssuedPayload = {
  certificateId: string;
  userId: string;
  issuedAt: string;
};

type CertificateRow = {
  id: string;
  userId: string;
  scope: 'topic' | 'subject' | 'domain';
  parentId: string;
  parentName: string;
  verificationCode: string;
  pdfUrl: string | null;
  issuedAt: Date;
  version: number;
};

export type CertificateDeliveryResult =
  | {
      status: 'completed';
      fileRef: string;
    }
  | {
      status: 'already-processed';
      fileRef: string;
    }
  | {
      status: 'duplicate';
      fileRef: null;
    };

type JobLockService = {
  acquireJobLock: typeof acquireJobLock;
  releaseJobLock: typeof releaseJobLock;
};

const DEFAULT_ISSUER_NAME = 'Tutorial Platform';

const getIssuerName = () => {
  const issuer = process.env.CERTIFICATE_ISSUER_NAME;
  if (typeof issuer === 'string' && issuer.trim().length > 0) {
    return issuer.trim();
  }
  return DEFAULT_ISSUER_NAME;
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(value);

const scopeLabel: Record<CertificateRow['scope'], string> = {
  topic: 'topic',
  subject: 'subject',
  domain: 'domain',
};

async function buildCertificatePdf(input: {
  studentName: string;
  scope: CertificateRow['scope'];
  parentName: string;
  verificationCode: string;
  issuedAt: Date;
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const width = page.getWidth();
  const height = page.getHeight();

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.05, 0.15, 0.24);
  const teal = rgb(0.05, 0.58, 0.63);
  const gold = rgb(0.87, 0.68, 0.23);
  const muted = rgb(0.30, 0.37, 0.43);
  const paper = rgb(0.99, 0.99, 0.98);

  page.drawRectangle({
    x: 14,
    y: 14,
    width: width - 28,
    height: height - 28,
    borderColor: teal,
    borderWidth: 3,
    color: paper,
  });

  page.drawRectangle({
    x: 38,
    y: height - 110,
    width: 170,
    height: 18,
    color: gold,
  });

  page.drawRectangle({
    x: width - 208,
    y: 92,
    width: 170,
    height: 18,
    color: gold,
  });

  const centerText = (text: string, y: number, size: number, font = regular, color = muted) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y,
      size,
      font,
      color,
    });
  };

  centerText(getIssuerName(), 510, 15, bold, teal);
  centerText('Certificate of Completion', 454, 28, bold, navy);
  centerText('This certifies that', 404, 16, regular, muted);
  centerText(input.studentName, 350, 30, bold, navy);

  const bodyText = `has successfully completed the ${scopeLabel[input.scope]} learning track for ${input.parentName}.`;
  page.drawText(bodyText, {
    x: 122,
    y: 290,
    size: 16,
    font: regular,
    color: muted,
    maxWidth: width - 244,
    lineHeight: 22,
  });

  page.drawLine({
    start: { x: 140, y: 265 },
    end: { x: width - 140, y: 265 },
    color: teal,
    thickness: 1.2,
    opacity: 0.45,
  });

  page.drawText(`Verification Code: ${input.verificationCode}`, {
    x: 126,
    y: 210,
    size: 13,
    font: bold,
    color: navy,
  });

  page.drawText(`Issued on ${formatDate(input.issuedAt)}`, {
    x: 126,
    y: 186,
    size: 12,
    font: regular,
    color: muted,
  });

  page.drawText(`Scope: ${input.scope.toUpperCase()} | Parent: ${input.parentName}`, {
    x: 126,
    y: 164,
    size: 11,
    font: regular,
    color: muted,
    maxWidth: width - 252,
  });

  const sealCenterX = width - 130;
  const sealCenterY = 150;
  page.drawEllipse({
    x: sealCenterX - 46,
    y: sealCenterY - 46,
    xScale: 46,
    yScale: 46,
    borderColor: gold,
    borderWidth: 2,
    color: rgb(1, 0.98, 0.9),
  });
  centerText('CERTIFIED', 145, 12, bold, gold);

  page.drawText('A verified tutorial completion record', {
    x: 126,
    y: 118,
    size: 11,
    font: regular,
    color: muted,
  });

  return Buffer.from(await pdf.save());
}

export class CertificateDeliveryService {
  private static instance: CertificateDeliveryService | null = null;
  private readonly log = logger.child({ module: 'certificate-delivery-service' });

  constructor(
    private readonly tutorialDbInstance = tutorialDb,
    private readonly peopleDbInstance = peopleDb,
    private readonly storageProvider = storage,
    private readonly jobLockService: JobLockService = {
      acquireJobLock,
      releaseJobLock,
    }
  ) {}

  static getInstance(): CertificateDeliveryService {
    if (CertificateDeliveryService.instance === null || CertificateDeliveryService.instance === undefined) {
      CertificateDeliveryService.instance = new CertificateDeliveryService();
    }
    return CertificateDeliveryService.instance;
  }

  async deliverIssuedCertificate(payload: CertificateIssuedPayload): Promise<CertificateDeliveryResult> {
    const certificateId = payload.certificateId.trim();
    const userId = payload.userId.trim();
    if (certificateId.length === 0) {
      throw new Error('certificateId is required');
    }
    if (userId.length === 0) {
      throw new Error('userId is required');
    }

    const lockId = `certificate-issued:${certificateId}`;
    const locked = await this.jobLockService.acquireJobLock(lockId, 600);
    if (!locked) {
      this.log.info({ certificateId, userId }, 'Duplicate certificate delivery ignored before processing');
      return { status: 'duplicate', fileRef: null };
    }

    try {
      const [certificate] = await withTimeout(
        this.tutorialDbInstance
          .select({
            id: certificates.id,
            userId: certificates.userId,
            scope: certificates.scope,
            parentId: certificates.parentId,
            parentName: certificates.parentName,
            verificationCode: certificates.verificationCode,
            pdfUrl: certificates.pdfUrl,
            issuedAt: certificates.issuedAt,
            version: certificates.version,
          })
          .from(certificates)
          .where(and(eq(certificates.id, certificateId), eq(certificates.userId, userId), isNull(certificates.deletedAt)))
          .limit(1),
        STANDARD_QUERY_TIMEOUT,
        'certificate.delivery.lookup'
      );

      if (certificate === undefined) {
        throw new Error(`Certificate not found: ${certificateId}`);
      }

      if (typeof certificate.pdfUrl === 'string' && certificate.pdfUrl.trim().length > 0) {
        const alreadyExists = await this.storageProvider.exists(certificate.pdfUrl);
        if (alreadyExists) {
          this.log.info({ certificateId, fileRef: certificate.pdfUrl }, 'Certificate PDF already exists');
          return { status: 'already-processed', fileRef: certificate.pdfUrl };
        }
      }

      const [profile] = await withTimeout(
        this.peopleDbInstance
          .select({
            name: userProfiles.name,
          })
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .limit(1),
        STANDARD_QUERY_TIMEOUT,
        'certificate.delivery.profile'
      );

      const studentName = typeof profile?.name === 'string' && profile.name.trim().length > 0 ? profile.name.trim() : userId;
      const buffer = await buildCertificatePdf({
        studentName,
        scope: certificate.scope,
        parentName: certificate.parentName,
        verificationCode: certificate.verificationCode,
        issuedAt: certificate.issuedAt,
      });

      const fileRef = await this.storageProvider.uploadObject(buffer, {
        key: `certificates/${userId}/${certificateId}.pdf`,
        contentType: 'application/pdf',
      });

      await withTimeout(
        this.tutorialDbInstance
          .update(certificates)
          .set({
            pdfUrl: fileRef,
            version: certificate.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(certificates.id, certificateId)),
        STANDARD_QUERY_TIMEOUT,
        'certificate.delivery.persist'
      );

      this.log.info({ certificateId, fileRef }, 'Certificate PDF generated and stored');
      return { status: 'completed', fileRef };
    } finally {
      await this.jobLockService.releaseJobLock(lockId);
    }
  }
}
