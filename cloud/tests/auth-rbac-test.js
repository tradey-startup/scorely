/**
 * Authentication & RBAC Test Suite
 *
 * Tests authentication system and role-based access control
 */

const auth = require('../auth-service');

console.log('\n🧪 Authentication & RBAC Test Suite');
console.log('=====================================\n');

let passedTests = 0;
let failedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ ${name}`);
    passedTests++;
    return true;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
    return false;
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ ${name}`);
    passedTests++;
    return true;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTests() {
  // Wait for PIN initialization
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Role System Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  test('ROLES constant exports all roles', () => {
    assert(auth.ROLES.DISPLAY === 'display', 'DISPLAY role incorrect');
    assert(auth.ROLES.CONTROLLER === 'controller', 'CONTROLLER role incorrect');
    assert(auth.ROLES.ADMIN === 'admin', 'ADMIN role incorrect');
  });

  test('getRolePermissions returns correct permissions for DISPLAY', () => {
    const perms = auth.getRolePermissions(auth.ROLES.DISPLAY);
    assert(perms.canView === true, 'DISPLAY should have canView');
    assert(perms.canControl === false, 'DISPLAY should not have canControl');
    assert(perms.canViewHistory === false, 'DISPLAY should not have canViewHistory');
    assert(perms.canManage === false, 'DISPLAY should not have canManage');
  });

  test('getRolePermissions returns correct permissions for CONTROLLER', () => {
    const perms = auth.getRolePermissions(auth.ROLES.CONTROLLER);
    assert(perms.canView === true, 'CONTROLLER should have canView');
    assert(perms.canControl === true, 'CONTROLLER should have canControl');
    assert(perms.canViewHistory === false, 'CONTROLLER should not have canViewHistory');
    assert(perms.canManage === false, 'CONTROLLER should not have canManage');
  });

  test('getRolePermissions returns correct permissions for ADMIN', () => {
    const perms = auth.getRolePermissions(auth.ROLES.ADMIN);
    assert(perms.canView === true, 'ADMIN should have canView');
    assert(perms.canControl === true, 'ADMIN should have canControl');
    assert(perms.canViewHistory === true, 'ADMIN should have canViewHistory');
    assert(perms.canManage === true, 'ADMIN should have canManage');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2. Authentication Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await asyncTest('DISPLAY role authenticates without PIN', async () => {
    const result = await auth.authenticate(auth.ROLES.DISPLAY);
    assert(result.success === true, 'Authentication should succeed');
    assert(result.token, 'Token should be returned');
    assert(result.role === auth.ROLES.DISPLAY, 'Role should be DISPLAY');
  });

  await asyncTest('CONTROLLER role requires PIN', async () => {
    const result = await auth.authenticate(auth.ROLES.CONTROLLER);
    assert(result.success === false, 'Authentication should fail without PIN');
    assert(result.error === 'PIN required', 'Error should mention PIN required');
  });

  await asyncTest('CONTROLLER role authenticates with correct PIN', async () => {
    const result = await auth.authenticate(auth.ROLES.CONTROLLER, '1234');
    assert(result.success === true, 'Authentication should succeed');
    assert(result.token, 'Token should be returned');
    assert(result.role === auth.ROLES.CONTROLLER, 'Role should be CONTROLLER');
  });

  await asyncTest('CONTROLLER role rejects wrong PIN', async () => {
    const result = await auth.authenticate(auth.ROLES.CONTROLLER, '0000');
    assert(result.success === false, 'Authentication should fail');
    assert(result.error === 'Invalid PIN', 'Error should mention invalid PIN');
  });

  await asyncTest('ADMIN role authenticates with correct PIN', async () => {
    const result = await auth.authenticate(auth.ROLES.ADMIN, '9999');
    assert(result.success === true, 'Authentication should succeed');
    assert(result.token, 'Token should be returned');
    assert(result.role === auth.ROLES.ADMIN, 'Role should be ADMIN');
  });

  await asyncTest('ADMIN role rejects wrong PIN', async () => {
    const result = await auth.authenticate(auth.ROLES.ADMIN, '1111');
    assert(result.success === false, 'Authentication should fail');
    assert(result.error === 'Invalid PIN', 'Error should mention invalid PIN');
  });

  await asyncTest('Invalid role is rejected', async () => {
    const result = await auth.authenticate('superadmin', '1234');
    assert(result.success === false, 'Authentication should fail');
    assert(result.error === 'Invalid role', 'Error should mention invalid role');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3. Token Generation & Validation Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let testToken;

  test('generateToken creates valid token', () => {
    testToken = auth.generateToken(auth.ROLES.CONTROLLER);
    assert(testToken, 'Token should be created');
    assert(typeof testToken === 'string', 'Token should be a string');
    assert(testToken.split('.').length === 3, 'Token should be JWT format');
  });

  test('verifyToken validates correct token', () => {
    const decoded = auth.verifyToken(testToken);
    assert(decoded, 'Token should be valid');
    assert(decoded.role === auth.ROLES.CONTROLLER, 'Decoded role should match');
    assert(decoded.timestamp, 'Token should have timestamp');
  });

  test('verifyToken rejects invalid token', () => {
    const decoded = auth.verifyToken('invalid.token.here');
    assert(decoded === null, 'Invalid token should return null');
  });

  test('verifyToken rejects empty token', () => {
    const decoded = auth.verifyToken('');
    assert(decoded === null, 'Empty token should return null');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4. Role Hierarchy Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let displayToken, controllerToken, adminToken;

  await asyncTest('Setup tokens for hierarchy tests', async () => {
    const d = await auth.authenticate(auth.ROLES.DISPLAY);
    const c = await auth.authenticate(auth.ROLES.CONTROLLER, '1234');
    const a = await auth.authenticate(auth.ROLES.ADMIN, '9999');
    displayToken = d.token;
    controllerToken = c.token;
    adminToken = a.token;
    assert(displayToken && controllerToken && adminToken, 'All tokens should be created');
  });

  test('ADMIN has CONTROLLER permissions', () => {
    assert(auth.hasRole(adminToken, auth.ROLES.CONTROLLER), 'ADMIN should have CONTROLLER role');
  });

  test('ADMIN has DISPLAY permissions', () => {
    assert(auth.hasRole(adminToken, auth.ROLES.DISPLAY), 'ADMIN should have DISPLAY role');
  });

  test('ADMIN has ADMIN permissions', () => {
    assert(auth.hasRole(adminToken, auth.ROLES.ADMIN), 'ADMIN should have ADMIN role');
  });

  test('CONTROLLER has DISPLAY permissions', () => {
    assert(auth.hasRole(controllerToken, auth.ROLES.DISPLAY), 'CONTROLLER should have DISPLAY role');
  });

  test('CONTROLLER has CONTROLLER permissions', () => {
    assert(auth.hasRole(controllerToken, auth.ROLES.CONTROLLER), 'CONTROLLER should have CONTROLLER role');
  });

  test('CONTROLLER does not have ADMIN permissions', () => {
    assert(!auth.hasRole(controllerToken, auth.ROLES.ADMIN), 'CONTROLLER should not have ADMIN role');
  });

  test('DISPLAY has DISPLAY permissions', () => {
    assert(auth.hasRole(displayToken, auth.ROLES.DISPLAY), 'DISPLAY should have DISPLAY role');
  });

  test('DISPLAY does not have CONTROLLER permissions', () => {
    assert(!auth.hasRole(displayToken, auth.ROLES.CONTROLLER), 'DISPLAY should not have CONTROLLER role');
  });

  test('DISPLAY does not have ADMIN permissions', () => {
    assert(!auth.hasRole(displayToken, auth.ROLES.ADMIN), 'DISPLAY should not have ADMIN role');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5. PIN Verification Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await asyncTest('verifyPIN accepts correct CONTROLLER PIN', async () => {
    const valid = await auth.verifyPIN(auth.ROLES.CONTROLLER, '1234');
    assert(valid === true, 'PIN should be valid');
  });

  await asyncTest('verifyPIN rejects wrong CONTROLLER PIN', async () => {
    const valid = await auth.verifyPIN(auth.ROLES.CONTROLLER, '9999');
    assert(valid === false, 'PIN should be invalid');
  });

  await asyncTest('verifyPIN accepts correct ADMIN PIN', async () => {
    const valid = await auth.verifyPIN(auth.ROLES.ADMIN, '9999');
    assert(valid === true, 'PIN should be valid');
  });

  await asyncTest('verifyPIN rejects wrong ADMIN PIN', async () => {
    const valid = await auth.verifyPIN(auth.ROLES.ADMIN, '1234');
    assert(valid === false, 'PIN should be invalid');
  });

  await asyncTest('verifyPIN accepts DISPLAY without PIN', async () => {
    const valid = await auth.verifyPIN(auth.ROLES.DISPLAY, null);
    assert(valid === true, 'DISPLAY should not need PIN');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('6. Security Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  test('Token contains role in payload', () => {
    const decoded = auth.verifyToken(adminToken);
    assert(decoded.role, 'Token should contain role');
    assert(decoded.role === auth.ROLES.ADMIN, 'Role should be ADMIN');
  });

  test('Token contains timestamp', () => {
    const decoded = auth.verifyToken(adminToken);
    assert(decoded.timestamp, 'Token should contain timestamp');
    assert(typeof decoded.timestamp === 'number', 'Timestamp should be a number');
  });

  test('Token contains issuer', () => {
    const decoded = auth.verifyToken(adminToken);
    assert(decoded.iss === 'scorely-auth-service', 'Token should have correct issuer');
  });

  test('Token contains expiration', () => {
    const decoded = auth.verifyToken(adminToken);
    assert(decoded.exp, 'Token should have expiration');
    assert(decoded.exp > Date.now() / 1000, 'Token should not be expired');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('7. Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`Total tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success rate: ${Math.round(passedTests / totalTests * 100)}%\n`);

  if (failedTests === 0) {
    console.log('╔════════════════════════════════════╗');
    console.log('║  ✅ ALL TESTS PASSED!             ║');
    console.log('╚════════════════════════════════════╝\n');
    process.exit(0);
  } else {
    console.log('╔════════════════════════════════════╗');
    console.log('║  ❌ SOME TESTS FAILED!            ║');
    console.log('╚════════════════════════════════════╝\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
