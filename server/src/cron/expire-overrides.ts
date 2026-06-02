import { expireOverrides } from '../services/override-scheduler';

async function main() {
  const result = await expireOverrides();

  console.log('\nOverride Expiry Run Summary:');
  console.log(`  Processed: ${result.processed}`);
  console.log(`  Expired:   ${result.expired}`);
  console.log(`  Valid:     ${result.stillValid}`);
  console.log(`  Re-eval:   ${result.eligibilityReevaluated}`);
  console.log(`  Notifs:    ${result.notificationsCreated}`);
  console.log(`  Errors:    ${result.errors}`);

  if (result.errors > 0) {
    process.exit(1);
  }
}

void main();
