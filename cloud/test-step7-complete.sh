#!/bin/bash

# STEP 7 Complete Test Script
# Tests the entire database integration flow

echo "🧪 STEP 7 - Complete Integration Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
total_tests=0
passed_tests=0
failed_tests=0

test_result() {
    total_tests=$((total_tests + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        passed_tests=$((passed_tests + 1))
    else
        echo -e "${RED}❌ $2${NC}"
        failed_tests=$((failed_tests + 1))
    fi
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. Checking Prerequisites${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Firebase Emulator is running
if lsof -ti:8080 > /dev/null 2>&1; then
    test_result 0 "Firebase Emulator is running"
else
    test_result 1 "Firebase Emulator is NOT running"
    echo -e "${YELLOW}⚠️  Start emulator with: firebase emulators:start --only firestore${NC}"
    echo ""
fi

# Check if files exist
[ -f "database-service.js" ]
test_result $? "database-service.js exists"

[ -f "api-service.js" ]
test_result $? "api-service.js exists"

[ -f "test-database.js" ]
test_result $? "test-database.js exists"

[ -f "../webapp/test/src/components/MatchHistory.jsx" ]
test_result $? "MatchHistory.jsx exists"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. Testing Database Service${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Run database test
if node test-database.js > /tmp/step7-db-test.log 2>&1; then
    test_result 0 "Database service test PASSED"
    echo -e "${GREEN}   All CRUD operations working${NC}"
else
    test_result 1 "Database service test FAILED"
    echo -e "${RED}   Check /tmp/step7-db-test.log for details${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. Testing API Service${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if API service is running
API_RUNNING=0
if lsof -ti:3001 > /dev/null 2>&1; then
    test_result 0 "API Service is running on port 3001"
    API_RUNNING=1

    # Test endpoints
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        test_result 0 "Health endpoint responding"
    else
        test_result 1 "Health endpoint not responding"
    fi

    if curl -s http://localhost:3001/api/matches > /dev/null 2>&1; then
        test_result 0 "Matches endpoint responding"
    else
        test_result 1 "Matches endpoint not responding"
    fi

    if curl -s http://localhost:3001/api/locations > /dev/null 2>&1; then
        test_result 0 "Locations endpoint responding"
    else
        test_result 1 "Locations endpoint not responding"
    fi
else
    test_result 1 "API Service is NOT running"
    echo -e "${YELLOW}⚠️  Start API service with: node api-service.js${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. Testing Integration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if session-service has database integration
if grep -q "database-service" session-service.js; then
    test_result 0 "Session service imports database-service"
else
    test_result 1 "Session service missing database import"
fi

if grep -q "saveMatch" session-service.js; then
    test_result 0 "Session service has saveMatch integration"
else
    test_result 1 "Session service missing saveMatch call"
fi

if grep -q "totalEvents" session-service.js; then
    test_result 0 "Session service tracks totalEvents"
else
    test_result 1 "Session service missing totalEvents tracking"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. Testing UI Components${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check UI integration
if grep -q "MatchHistory" ../webapp/test/src/App.jsx; then
    test_result 0 "App.jsx imports MatchHistory"
else
    test_result 1 "App.jsx missing MatchHistory import"
fi

if grep -q "currentPage" ../webapp/test/src/App.jsx; then
    test_result 0 "App.jsx has navigation state"
else
    test_result 1 "App.jsx missing navigation state"
fi

if grep -q "Storico" ../webapp/test/src/App.jsx; then
    test_result 0 "App.jsx has History tab"
else
    test_result 1 "App.jsx missing History tab"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6. Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Total tests: $total_tests"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Failed: ${RED}$failed_tests${NC}"
echo ""

percentage=$((passed_tests * 100 / total_tests))

if [ $percentage -ge 90 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ STEP 7 COMPLETE! ($percentage%)${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
elif [ $percentage -ge 70 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  STEP 7 MOSTLY COMPLETE ($percentage%)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ STEP 7 INCOMPLETE ($percentage%)${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

echo ""
echo "📚 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $failed_tests -gt 0 ]; then
    echo "1. Fix failing tests above"
    echo ""
fi

echo "To run full system test:"
echo ""
echo "Terminal 1: firebase emulators:start --only firestore"
echo "Terminal 2: node session-service.js"
echo "Terminal 3: node pairing-service.js"
echo "Terminal 4: node api-service.js"
echo "Terminal 5: cd ../webapp/test && npm run dev"
echo ""
echo "Then:"
echo "1. Open http://localhost:5173"
echo "2. Create a new match"
echo "3. Play and end the match"
echo "4. Click 'Storico' tab"
echo "5. Verify match appears in history"
echo ""

if [ $percentage -ge 90 ]; then
    echo -e "${GREEN}Ready to proceed to STEP 8! 🚀${NC}"
fi

echo ""
