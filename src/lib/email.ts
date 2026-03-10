import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface DownPage {
  name: string;
  url: string;
  statusCode: number | null;
  error: string | null;
  responseTime: number | null;
  checkedAt: Date;
  redirected?: boolean;
}

export async function sendDowntimeAlert(
  emails: string[],
  downPages: DownPage[]
) {
  if (!emails.length || !downPages.length) return;

  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'monitor@seoptima.com';

  const pageRows = downPages
    .map(
      (p) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #2a2a3e;color:#fff;font-weight:600;">${p.name}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #2a2a3e;">
            <a href="${p.url}" style="color:#818cf8;text-decoration:none;">${p.url}</a>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #2a2a3e;text-align:center;">
            <span style="background:${p.redirected ? '#eab308' : '#ef4444'};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">
              ${p.redirected ? 'REDIRECT' : (p.statusCode ?? 'N/A')}
            </span>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #2a2a3e;color:#a1a1aa;font-size:13px;">
            ${p.error || (p.redirected ? 'Redirect detected' : 'Page unreachable')}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #2a2a3e;color:#a1a1aa;font-size:13px;">
            ${p.responseTime ? p.responseTime + 'ms' : '—'}
          </td>
        </tr>`
    )
    .join('');

  const hasOnlyRedirects = downPages.every(p => p.redirected);
  const icon = hasOnlyRedirects ? '⚠️' : '🔴';
  const headerColor = hasOnlyRedirects ? '#eab308' : '#ef4444';
  const alertTitle = hasOnlyRedirects ? 'Website Redirect Alert' : 'Website Attention Alert';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:700px;margin:0 auto;padding:40px 20px;">
        <div style="background:linear-gradient(135deg,#1e1e2e,#2a2a3e);border-radius:16px;padding:32px;border:1px solid #3a3a4e;">
          <!-- Header -->
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;background:${headerColor};width:48px;height:48px;border-radius:12px;line-height:48px;font-size:24px;margin-bottom:12px;">${icon}</div>
            <h1 style="color:#fff;margin:8px 0 4px;font-size:22px;">${alertTitle}</h1>
            <p style="color:#a1a1aa;font-size:14px;margin:0;">
              ${downPages.length} page${downPages.length > 1 ? 's' : ''} require attention — ${new Date().toLocaleString()}
            </p>
          </div>

          <!-- Table -->
          <table style="width:100%;border-collapse:collapse;background:#16162a;border-radius:12px;overflow:hidden;">
            <thead>
              <tr style="background:#1e1e30;">
                <th style="padding:10px 16px;text-align:left;color:#818cf8;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Monitor</th>
                <th style="padding:10px 16px;text-align:left;color:#818cf8;font-size:11px;text-transform:uppercase;letter-spacing:1px;">URL</th>
                <th style="padding:10px 16px;text-align:center;color:#818cf8;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Status</th>
                <th style="padding:10px 16px;text-align:left;color:#818cf8;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Error</th>
                <th style="padding:10px 16px;text-align:left;color:#818cf8;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Response</th>
              </tr>
            </thead>
            <tbody>
              ${pageRows}
            </tbody>
          </table>

          <!-- Footer -->
          <div style="text-align:center;margin-top:24px;padding-top:20px;border-top:1px solid #2a2a3e;">
            <p style="color:#71717a;font-size:12px;margin:0;">Sent by Seoptima Uptime Monitor</p>
          </div>
        </div>
      </div>
    </body>
    </html>`;

  // Extract base monitor names to avoid repeating the same name multiple times or long URLs
  const monitorNames = Array.from(new Set(downPages.map(p => {
    // If the name is like "MonitorName - https://pageurl", extract just "MonitorName"
    const parts = p.name.split(' - ');
    return parts[0];
  })));

  const monitorNamesStr = monitorNames.join(', ');
  const subject = `${icon} ALERT: ${downPages.length} page${downPages.length > 1 ? 's' : ''} need attention — ${monitorNamesStr}`;

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: emails.join(','),
      subject,
      html,
    });
    console.log(`[UptimeMonitor] Alert sent to ${emails.length} recipient(s)`);
  } catch (error) {
    console.error('[UptimeMonitor] Failed to send email:', error);
  }
}

// ── Site Crawl Report ──────────────────────────────────────────────────

interface CrawlReportPage {
  url: string;
  statusCode: number | null;
  responseTime: number;
  isUp: boolean;
  error: string | null;
  redirected?: boolean;
  finalUrl?: string;
}

interface CrawlReportData {
  siteName: string;
  siteUrl: string;
  totalPages: number;
  upCount: number;
  downCount: number;
  redirectCount?: number;
  avgResponseTime: number;
  pages: CrawlReportPage[];
  checkedAt: Date;
}

export async function sendSiteCrawlReport(emails: string[], report: CrawlReportData) {
  if (!emails.length) return;

  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'monitor@seoptima.com';
  const hasDown = report.downCount > 0;
  const hasRedirect = (report.redirectCount ?? 0) > 0;
  const uptimePercent = report.totalPages > 0
    ? Math.round((report.upCount / report.totalPages) * 100)
    : 0;

  // Build page rows — show DOWN pages first, then UP pages
  const sorted = [...report.pages].sort((a, b) => {
    if (a.isUp === b.isUp) return 0;
    return a.isUp ? 1 : -1;
  });

  const pageRows = sorted
    .map(
      (p) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #2a2a3e;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.isUp ? '#22c55e' : (p.redirected ? '#eab308' : '#ef4444')};margin-right:8px;"></span>
            <span style="color:${p.isUp ? '#22c55e' : (p.redirected ? '#eab308' : '#ef4444')};font-weight:700;font-size:11px;">${p.isUp ? (p.redirected ? 'REDIRECT' : 'UP') : 'DOWN'}</span>
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #2a2a3e;">
            <a href="${p.url}" style="color:#818cf8;text-decoration:none;font-size:13px;word-break:break-all;">${p.url}</a>
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #2a2a3e;text-align:center;">
            <span style="background:${p.isUp ? (p.redirected ? '#eab308' : '#16a34a') : '#ef4444'};color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;">
              ${p.redirected ? 'REDIR' : (p.statusCode ?? 'ERR')}
            </span>
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #2a2a3e;color:#a1a1aa;font-size:12px;max-width:250px;word-break:break-word;">
            ${p.error ? p.error.replace(`[${p.url}] `, '') : (p.redirected ? `Redirected to ${p.finalUrl}` : '—')}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #2a2a3e;color:#a1a1aa;font-size:12px;white-space:nowrap;">
            ${p.responseTime}ms
          </td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:800px;margin:0 auto;padding:40px 20px;">
        <div style="background:linear-gradient(135deg,#1e1e2e,#2a2a3e);border-radius:16px;padding:32px;border:1px solid #3a3a4e;">
          <!-- Header -->
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;background:${hasDown ? '#ef4444' : '#22c55e'};width:48px;height:48px;border-radius:12px;line-height:48px;font-size:24px;margin-bottom:12px;">${hasDown ? '🔴' : '✅'}</div>
            <h1 style="color:#fff;margin:8px 0 4px;font-size:22px;">Site Crawl Report — ${report.siteName}</h1>
            <p style="color:#a1a1aa;font-size:14px;margin:0;">
              ${report.siteUrl} — ${new Date(report.checkedAt).toLocaleString()}
            </p>
          </div>

          <!-- Summary Stats -->
          <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
            <div style="flex:1;min-width:120px;background:#16162a;border-radius:12px;padding:16px;text-align:center;border:1px solid #2a2a3e;">
              <p style="color:#818cf8;font-size:28px;font-weight:800;margin:0;">${report.totalPages}</p>
              <p style="color:#71717a;font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">Total</p>
            </div>
            <div style="flex:1;min-width:120px;background:#16162a;border-radius:12px;padding:16px;text-align:center;border:1px solid #2a2a3e;">
              <p style="color:#22c55e;font-size:28px;font-weight:800;margin:0;">${report.upCount}</p>
              <p style="color:#71717a;font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">UP</p>
            </div>
            ${(report.redirectCount ?? 0) > 0 ? `
            <div style="flex:1;min-width:120px;background:#16162a;border-radius:12px;padding:16px;text-align:center;border:1px solid #2a2a3e;">
              <p style="color:#eab308;font-size:28px;font-weight:800;margin:0;">${report.redirectCount}</p>
              <p style="color:#71717a;font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">Redir</p>
            </div>` : ''}
            <div style="flex:1;min-width:120px;background:#16162a;border-radius:12px;padding:16px;text-align:center;border:1px solid #2a2a3e;">
              <p style="color:${report.downCount > 0 ? '#ef4444' : '#22c55e'};font-size:28px;font-weight:800;margin:0;">${report.downCount}</p>
              <p style="color:#71717a;font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">DOWN</p>
            </div>
            <div style="flex:1;min-width:120px;background:#16162a;border-radius:12px;padding:16px;text-align:center;border:1px solid #2a2a3e;">
              <p style="color:${uptimePercent >= 99 ? '#22c55e' : uptimePercent >= 90 ? '#eab308' : '#ef4444'};font-size:28px;font-weight:800;margin:0;">${uptimePercent}%</p>
              <p style="color:#71717a;font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">Uptime</p>
            </div>
          </div>

          ${hasDown ? `
          <!-- Alert Banner -->
          <div style="background:#ef44441a;border:1px solid #ef444433;border-radius:12px;padding:14px 20px;margin-bottom:20px;">
            <p style="color:#fca5a5;font-size:14px;margin:0;font-weight:600;">
              ⚠️ ${report.downCount} page${report.downCount > 1 ? 's are' : ' is'} currently DOWN and needs attention
            </p>
          </div>
          ` : hasRedirect ? `
          <div style="background:#eab3081a;border:1px solid #eab30833;border-radius:12px;padding:14px 20px;margin-bottom:20px;">
            <p style="color:#fde047;font-size:14px;margin:0;font-weight:600;">
              ⚠️ ${report.redirectCount} page${report.redirectCount! > 1 ? 's' : ''} redirected
            </p>
          </div>
          ` : `
          <div style="background:#22c55e1a;border:1px solid #22c55e33;border-radius:12px;padding:14px 20px;margin-bottom:20px;">
            <p style="color:#86efac;font-size:14px;margin:0;font-weight:600;">
              ✅ All ${report.totalPages} pages are UP and responding normally
            </p>
          </div>
          `}

          <!-- Page Details Table -->
          <table style="width:100%;border-collapse:collapse;background:#16162a;border-radius:12px;overflow:hidden;">
            <thead>
              <tr style="background:#1e1e30;">
                <th style="padding:10px 14px;text-align:left;color:#818cf8;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Status</th>
                <th style="padding:10px 14px;text-align:left;color:#818cf8;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Page URL</th>
                <th style="padding:10px 14px;text-align:center;color:#818cf8;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Code</th>
                <th style="padding:10px 14px;text-align:left;color:#818cf8;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Error</th>
                <th style="padding:10px 14px;text-align:left;color:#818cf8;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Response</th>
              </tr>
            </thead>
            <tbody>
              ${pageRows}
            </tbody>
          </table>

          <!-- Footer -->
          <div style="text-align:center;margin-top:24px;padding-top:20px;border-top:1px solid #2a2a3e;">
            <p style="color:#71717a;font-size:12px;margin:0;">Avg response: ${report.avgResponseTime}ms • Sent by Seoptima Site Monitor</p>
          </div>
        </div>
      </div>
    </body>
    </html>`;

  const subject = hasDown
    ? `🔴 Site Report: ${report.downCount} pages DOWN — ${report.siteName}`
    : hasRedirect
      ? `⚠️ Site Report: ${report.redirectCount} redirects detected — ${report.siteName}`
      : `✅ Site Report: All ${report.totalPages} pages UP — ${report.siteName}`;

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: emails.join(','),
      subject,
      html,
    });
    console.log(`[SiteCrawl] Report sent to ${emails.length} recipient(s)`);
  } catch (error) {
    console.error('[SiteCrawl] Failed to send email:', error);
  }
}

