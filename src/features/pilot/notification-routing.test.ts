import { expect, it } from 'vitest';
import { notificationEnvelope } from './notification-routing';
it('separates sender and destinations without turning mailbox access into approval authority', () => {
 const config = { sender: 'site@example.test', operationalRecipient: 'site@example.test', accountRequestRecipient: 'personal@example.test' };
 expect(notificationEnvelope(config, 'operations')).toEqual({ from: config.sender, to: config.operationalRecipient, kind: 'operations', grantsApproval: false });
 expect(notificationEnvelope(config, 'account-request')).toEqual({ from: config.sender, to: config.accountRequestRecipient, kind: 'account-request', grantsApproval: false, approvalRequires: 'authenticated-approved-owner' });
 expect(notificationEnvelope({ ...config, accountRequestRecipient: 'another@example.test' }, 'account-request').grantsApproval).toBe(false);
 expect(() => notificationEnvelope({ ...config, sender: 'site@example.test\r\nBcc: other@example.test' }, 'operations')).toThrow('invalid_notification_address');
});
