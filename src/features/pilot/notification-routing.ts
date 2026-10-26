/** Local configuration contract only. No transport, secrets, email delivery or approval token. */
export type NotificationConfig = {
 sender: string;
 operationalRecipient: string;
 accountRequestRecipient: string;
};
export function notificationEnvelope(config: NotificationConfig, kind: 'operations' | 'account-request') {
 const address = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
 if (Object.values(config).some(value => !address.test(value) || /[\r\n]/.test(value))) throw Error('invalid_notification_address');
 return { from: config.sender, to: kind === 'operations' ? config.operationalRecipient : config.accountRequestRecipient,
  kind, grantsApproval: false as const, ...(kind === 'account-request' ? { approvalRequires: 'authenticated-approved-owner' as const } : {}) };
}
