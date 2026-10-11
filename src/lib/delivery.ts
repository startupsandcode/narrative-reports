/**
 * STUBBED delivery. In v1 no email is ever actually sent — every "send" is a
 * console log. Real delivery (Resend / SES / etc.) is a v2 task that requires
 * John's approval of the exact content and a real mail account.
 */
export interface ReportDelivery {
  to: string;
  agencyName: string;
  clientName: string;
  periodLabel: string;
  pdfBytes: number;
}

export async function sendReportEmailStub(delivery: ReportDelivery): Promise<{ sent: false; stub: true }> {
  console.log(
    `[EMAIL STUB] Would email "${delivery.periodLabel} report" ` +
      `for ${delivery.clientName} to ${delivery.to} ` +
      `(agency: ${delivery.agencyName}, PDF ${delivery.pdfBytes} bytes). ` +
      `Delivery is STUBBED in v1 — no email was sent.`
  );
  return { sent: false, stub: true };
}
