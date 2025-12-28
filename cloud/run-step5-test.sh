#!/bin/bash

# STEP 5 Quick Test Runner
# This script helps you run all necessary services for STEP 5 testing

echo "🎮 STEP 5 Multi-Bracelet Test Runner"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script will guide you through testing STEP 5."
echo ""
echo "You need 3 terminal windows:"
echo ""
echo "  Terminal 1: Session Service"
echo "  Terminal 2: Pairing Service"
echo "  Terminal 3: Test Script (this script)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if session-service.js is running
if ! pgrep -f "session-service.js" > /dev/null; then
    echo "⚠️  WARNING: session-service.js is NOT running!"
    echo ""
    echo "Please run in Terminal 1:"
    echo "  cd cloud && node session-service.js"
    echo ""
    read -p "Press Enter when session-service.js is running..."
fi

# Check if pairing-service.js is running
if ! pgrep -f "pairing-service.js" > /dev/null; then
    echo "⚠️  WARNING: pairing-service.js is NOT running!"
    echo ""
    echo "Please run in Terminal 2:"
    echo "  cd cloud && node pairing-service.js"
    echo ""
    read -p "Press Enter when pairing-service.js is running..."
fi

echo "✅ Prerequisites check complete!"
echo ""
echo "Starting multi-bracelet test script..."
echo ""

# Run the test script
node test-multi-bracelet.js
