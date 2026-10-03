import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { callerAddress, policyFor } from './middleware';

function request(path: string, method = 'GET', headers?: HeadersInit) {
  return new NextRequest(`https://dashboard.example${path}`, { method, headers });
}

describe('rate-limit policy routing', () => {
  it('uses separate WhatsApp verification and ingress budgets', () => {
    expect(policyFor(request('/api/webhooks/whatsapp'))).toEqual({
      scope: 'webhook:whatsapp:verify',
      limit: 30,
      windowSeconds: 60,
    });
    expect(policyFor(request('/api/webhooks/whatsapp', 'POST'))).toEqual({
      scope: 'webhook:whatsapp:ingress',
      limit: 180,
      windowSeconds: 60,
    });
  });

  it('limits cron and authenticated mutation endpoints', () => {
    expect(policyFor(request('/api/cron/followup-scheduler', 'POST'))?.limit).toBe(10);
    expect(policyFor(request('/api/whatsai/reply', 'POST'))?.limit).toBe(120);
    expect(policyFor(request('/api/whatsai/reply'))).toBeNull();
  });

  it('does not rate-limit page routes', () => {
    expect(policyFor(request('/dashboard'))).toBeNull();
  });
});

describe('trusted caller address selection', () => {
  it('prefers the edge-provided real IP', () => {
    expect(callerAddress(request('/api/ping', 'POST', {
      'x-real-ip': '203.0.113.5',
      'x-forwarded-for': '198.51.100.2, 192.0.2.8',
    }))).toBe('203.0.113.5');
  });

  it('uses the address appended at the trusted edge', () => {
    expect(callerAddress(request('/api/ping', 'POST', {
      'x-forwarded-for': '198.51.100.2, 192.0.2.8',
    }))).toBe('192.0.2.8');
  });
});
