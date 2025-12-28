#!/bin/bash

# Scorely System Analyzer
# Analizza lo stato attuale del sistema e genera un report

echo "🔍 Scorely System Analyzer"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
total_checks=0
passed_checks=0
failed_checks=0

check_result() {
    total_checks=$((total_checks + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        passed_checks=$((passed_checks + 1))
    else
        echo -e "${RED}❌ $2${NC}"
        failed_checks=$((failed_checks + 1))
    fi
}

echo "📁 1. Project Structure"
echo "----------------------"

# Check cloud services
[ -f "cloud/session-service.js" ]
check_result $? "Session Service exists"

[ -f "cloud/pairing-service.js" ]
check_result $? "Pairing Service exists"

# Check test scripts
[ -f "cloud/test-multi-bracelet.js" ]
check_result $? "Multi-bracelet test script exists"

# Check web app
[ -f "webapp/test/package.json" ]
check_result $? "Web App exists"

[ -f "webapp/test/src/App.jsx" ]
check_result $? "Web App main component exists"

# Check Firebase Functions
[ -d "cloud/functions" ]
check_result $? "Firebase Functions directory exists"

[ -f "cloud/functions/package.json" ]
check_result $? "Firebase Functions package.json exists"

echo ""
echo "📦 2. Dependencies"
echo "----------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
    passed_checks=$((passed_checks + 1))
else
    echo -e "${RED}❌ Node.js not found${NC}"
    failed_checks=$((failed_checks + 1))
fi
total_checks=$((total_checks + 1))

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm installed: $NPM_VERSION${NC}"
    passed_checks=$((passed_checks + 1))
else
    echo -e "${RED}❌ npm not found${NC}"
    failed_checks=$((failed_checks + 1))
fi
total_checks=$((total_checks + 1))

# Check cloud node_modules
if [ -d "cloud/node_modules" ]; then
    echo -e "${GREEN}✅ Cloud services dependencies installed${NC}"
    passed_checks=$((passed_checks + 1))
else
    echo -e "${YELLOW}⚠️  Cloud services dependencies not installed (run: cd cloud && npm install)${NC}"
    failed_checks=$((failed_checks + 1))
fi
total_checks=$((total_checks + 1))

# Check webapp node_modules
if [ -d "webapp/test/node_modules" ]; then
    echo -e "${GREEN}✅ Web App dependencies installed${NC}"
    passed_checks=$((passed_checks + 1))
else
    echo -e "${YELLOW}⚠️  Web App dependencies not installed (run: cd webapp/test && npm install)${NC}"
    failed_checks=$((failed_checks + 1))
fi
total_checks=$((total_checks + 1))

echo ""
echo "🔌 3. Services Status"
echo "----------------------"

# Check if session-service is running
if pgrep -f "session-service.js" > /dev/null; then
    echo -e "${GREEN}✅ Session Service is running${NC}"
    passed_checks=$((passed_checks + 1))
else
    echo -e "${YELLOW}⚠️  Session Service is NOT running${NC}"
    failed_checks=$((failed_checks + 1))
fi
total_checks=$((total_checks + 1))

# Check if pairing-service is running
if pgrep -f "pairing-service.js" > /dev/null; then
    echo -e "${GREEN}✅ Pairing Service is running${NC}"
    passed_checks=$((passed_checks + 1))
else
    echo -e "${YELLOW}⚠️  Pairing Service is NOT running${NC}"
    failed_checks=$((failed_checks + 1))
fi
total_checks=$((total_checks + 1))

# Check if web app is running (Vite)
if lsof -ti:5173 > /dev/null 2>&1 || lsof -ti:5174 > /dev/null 2>&1; then
    PORT=$(lsof -ti:5173 > /dev/null 2>&1 && echo "5173" || echo "5174")
    echo -e "${GREEN}✅ Web App is running on port $PORT${NC}"
    passed_checks=$((passed_checks + 1))
else
    echo -e "${YELLOW}⚠️  Web App is NOT running${NC}"
    failed_checks=$((failed_checks + 1))
fi
total_checks=$((total_checks + 1))

echo ""
echo "📊 4. Code Statistics"
echo "----------------------"

# Count JavaScript/TypeScript files
JS_FILES=$(find . -name "*.js" -o -name "*.ts" | grep -v node_modules | wc -l | tr -d ' ')
echo "JavaScript/TypeScript files: $JS_FILES"

# Count React components
JSX_FILES=$(find . -name "*.jsx" -o -name "*.tsx" | grep -v node_modules | wc -l | tr -d ' ')
echo "React components: $JSX_FILES"

# Count test files
TEST_FILES=$(find cloud -name "test-*.js" | wc -l | tr -d ' ')
echo "Test scripts: $TEST_FILES"

# Lines of code (approximation)
LOC=$(find . \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
echo "Total lines of code: ~$LOC"

echo ""
echo "🎯 5. Completed Steps"
echo "----------------------"

# Check README for completed steps
if grep -q "STEP 1.*✅" README.md 2>/dev/null; then
    echo -e "${GREEN}✅ STEP 1: Core del sistema${NC}"
else
    echo -e "${RED}❌ STEP 1: Not completed${NC}"
fi

if grep -q "STEP 2.*✅" README.md 2>/dev/null; then
    echo -e "${GREEN}✅ STEP 2: Web App minimale${NC}"
else
    echo -e "${RED}❌ STEP 2: Not completed${NC}"
fi

if grep -q "STEP 3.*✅" README.md 2>/dev/null; then
    echo -e "${GREEN}✅ STEP 3: Pairing base${NC}"
else
    echo -e "${RED}❌ STEP 3: Not completed${NC}"
fi

if grep -q "STEP 4.*✅" README.md 2>/dev/null; then
    echo -e "${GREEN}✅ STEP 4: Stato persistente${NC}"
else
    echo -e "${RED}❌ STEP 4: Not completed${NC}"
fi

if grep -q "STEP 5.*✅" README.md 2>/dev/null; then
    echo -e "${GREEN}✅ STEP 5: Multi-braccialetto${NC}"
else
    echo -e "${RED}❌ STEP 5: Not completed${NC}"
fi

if grep -q "STEP 6.*✅" README.md 2>/dev/null; then
    echo -e "${GREEN}✅ STEP 6: UX reale${NC}"
else
    echo -e "${RED}❌ STEP 6: Not completed${NC}"
fi

echo ""
echo "📝 6. Documentation"
echo "----------------------"

DOCS=(
    "README.md"
    "STEP5-MULTI-BRACELET-GUIDE.md"
    "STEP6-UX-GUIDE.md"
    "STEP6-QUICK-START.md"
    "STEP6-FIXES.md"
    "STEPS-7-11-IMPLEMENTATION-PLAN.md"
)

doc_count=0
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        doc_count=$((doc_count + 1))
        echo -e "${GREEN}✅ $doc${NC}"
    fi
done

echo ""
echo "=========================="
echo "📈 SUMMARY"
echo "=========================="
echo "Total checks: $total_checks"
echo -e "Passed: ${GREEN}$passed_checks${NC}"
echo -e "Failed: ${RED}$failed_checks${NC}"
echo "Documentation files: $doc_count"
echo ""

# Calculate percentage
percentage=$((passed_checks * 100 / total_checks))

if [ $percentage -ge 80 ]; then
    echo -e "${GREEN}✅ System Health: GOOD ($percentage%)${NC}"
elif [ $percentage -ge 60 ]; then
    echo -e "${YELLOW}⚠️  System Health: FAIR ($percentage%)${NC}"
else
    echo -e "${RED}❌ System Health: POOR ($percentage%)${NC}"
fi

echo ""
echo "🚀 Quick Start Commands:"
echo "------------------------"
echo "Start Session Service:  cd cloud && node session-service.js"
echo "Start Pairing Service:  cd cloud && node pairing-service.js"
echo "Start Web App:          cd webapp/test && npm run dev"
echo "Run Tests:              cd cloud && node test-multi-bracelet.js [SESSION_ID]"
echo ""
