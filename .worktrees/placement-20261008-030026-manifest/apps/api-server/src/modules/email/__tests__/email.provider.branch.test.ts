import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { EmailService } from "../EmailService"
import { MockEmailProvider } from "../providers/MockEmailProvider"
import { ResendEmailProvider } from "../providers/ResendEmailProvider"

vi.mock("resend", () => {
  return {
    Resend: vi.fn(function Resend() {
      return {
        emails: {
          send: vi.fn().mockResolvedValue({ data: { id: "abc123" }, error: null }),
        },
      }
    }),
  }
})

describe("EmailService provider selection", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(EmailService as any).instance = null
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    ;(EmailService as any).instance = null
  })

  it("defaults to mock provider when EMAIL_PROVIDER is not set", async () => {
    delete process.env.EMAIL_PROVIDER
    const instance = EmailService.getInstance()
    expect(instance).toBeInstanceOf(MockEmailProvider)
    const spy = vi.spyOn(instance, "sendEmail").mockResolvedValue()
    await EmailService.sendPasswordResetEmail("user@test.com", "https://reset", "skillup")
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      to: "user@test.com",
      subject: expect.stringContaining("SkillUp IT Academy"),
      html: expect.stringContaining("SkillUp IT Academy password reset"),
    }))
  })

  it("falls back to mock when RESEND selected without api key", () => {
    process.env.EMAIL_PROVIDER = "resend"
    process.env.RESEND_API_KEY = ""
    const instance = EmailService.getInstance()
    expect(instance).toBeInstanceOf(MockEmailProvider)
  })

  it("creates Resend provider when api key is present", async () => {
    process.env.EMAIL_PROVIDER = "resend"
    process.env.RESEND_API_KEY = "key-123"
    process.env.EMAIL_FROM = "Quiz <noreply@example.com>"

    const instance = EmailService.getInstance()
    expect(instance).toBeInstanceOf(ResendEmailProvider)

    const sendSpy = vi.spyOn(instance as any, "sendEmail")
    await EmailService.sendPasswordResetEmail("user@test.com", "https://reset", "realtutorialhub")
    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
      to: "user@test.com",
      subject: expect.stringContaining("Real Tutorial Hub"),
      html: expect.stringContaining("Real Tutorial Hub password reset"),
    }))
  })
})
