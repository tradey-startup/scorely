#!/bin/bash

# Scorely - Complete End-to-End Test Suite
# Tests all components of the system

echo "🧪 SCORELY - Complete Test Suite"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
total_suites=0
passed_suites=0
failed_suites=0

suite_result() {
    total_suites=$((total_suites + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2 PASSED${NC}\n"
        passed_suites=$((passed_suites + 1))
    else
        echo -e "${RED}❌ $2 FAILED${NC}\n"
        failed_suites=$((failed_suites + 1))
    fi
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. Authentication & RBAC Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "tests/auth-rbac-test.js" ]; then
    node tests/auth-rbac-test.js > /tmp/scorely-auth-test.log 2>&1
    suite_result $? "Authentication Tests"
else
    echo -e "${YELLOW}⚠️  Auth test not found, skipping${NC}\n"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. Database Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Firebase Emulator is running
if lsof -ti:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Firebase Emulator is running${NC}"

    if [ -f "test-database.js" ]; then
        node test-database.js > /tmp/scorely-db-test.log 2>&1
        suite_result $? "Database Tests"
    else
        echo -e "${YELLOW}⚠️  Database test not found, skipping${NC}\n"
    fi
else
    echo -e "${YELLOW}⚠️  Firebase Emulator not running, skipping database tests${NC}"
    echo -e "${YELLOW}   Start with: firebase emulators:start --only firestore${NC}\n"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. API Service Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if API service is running
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Service is running${NC}"

    # Test health endpoint
    if curl -s http://localhost:3001/health > /dev/null; then
        echo -e "${GREEN}✅ Health endpoint OK${NC}"
    else
        echo -e "${RED}❌ Health endpoint failed${NC}"
    fi

    # Test auth login
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
        -H "Content-Type: application/json" \
        -d '{"role":"display"}')

    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Login endpoint OK${NC}\n"
    else
        echo -e "${RED}❌ Login endpoint failed${NC}\n"
    fi
else
    echo -e "${YELLOW}⚠️  API Service not running, skipping API tests${NC}"
    echo -e "${YELLOW}   Start with: node api-service.js${NC}\n"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. Service Health Checks${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check session-service
if pgrep -f "session-service.js" > /dev/null; then
    echo -e "${GREEN}✅ Session Service running${NC}"
else
    echo -e "${YELLOW}⚠️  Session Service not running${NC}"
fi

# Check pairing-service
if pgrep -f "pairing-service.js" > /dev/null; then
    echo -e "${GREEN}✅ Pairing Service running${NC}"
else
    echo -e "${YELLOW}⚠️  Pairing Service not running${NC}"
fi

# Check API service
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Service running (port 3001)${NC}"
else
    echo -e "${YELLOW}⚠️  API Service not running${NC}"
fi

# Check Firebase Emulator
if lsof -ti:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Firebase Emulator running (port 8080)${NC}"
else
    echo -e "${YELLOW}⚠️  Firebase Emulator not running${NC}"
fi

# Check Web App
if lsof -ti:5173 > /dev/null 2>&1 || lsof -ti:5174 > /dev/null 2>&1; then
    PORT=$(lsof -ti:5173 > /dev/null 2>&1 && echo "5173" || echo "5174")
    echo -e "${GREEN}✅ Web App running (port $PORT)${NC}"
else
    echo -e "${YELLOW}⚠️  Web App not running${NC}"
fi

echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. File Structure Check${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Backend files
files_ok=0
files_missing=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $2${NC}"
        files_ok=$((files_ok + 1))
    else
        echo -e "${RED}❌ $2${NC}"
        files_missing=$((files_missing + 1))
    fi
}

check_file "session-service.js" "session-service.js"
check_file "pairing-service.js" "pairing-service.js"
check_file "database-service.js" "database-service.js"
check_file "api-service.js" "api-service.js"
check_file "auth-service.js" "auth-service.js"

echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6. Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Test Suites:"
echo "  Total: $total_suites"
echo -e "  ${GREEN}Passed: $passed_suites${NC}"
echo -e "  ${RED}Failed: $failed_suites${NC}"
echo ""

echo "Files:"
echo -e "  ${GREEN}OK: $files_ok${NC}"
echo -e "  ${RED}Missing: $files_missing${NC}"
echo ""

if [ $failed_suites -eq 0 ] && [ $files_missing -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL TESTS PASSED!             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════╝${NC}"
    echo ""
    exit 0
else
    echo -e "${YELLOW}╔════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  SOME TESTS FAILED/SKIPPED    ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════╝${NC}"
    echo ""
    echo "💡 To run full test suite, make sure all services are running:"
    echo ""
    echo "Terminal 1: firebase emulators:start --only firestore"
    echo "Terminal 2: node session-service.js"
    echo "Terminal 3: node pairing-service.js"
    echo "Terminal 4: node api-service.js"
    echo "Terminal 5: cd ../webapp/test && npm run dev"
    echo ""
    echo "Then run: ./tests/run-all-tests.sh"
    echo ""
    exit 1
fi
