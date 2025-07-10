#!/bin/bash

# E-Commerce Backend Step-by-Step Testing
echo "🧪 E-Commerce Backend Testing - Step by Step"
echo "=============================================="

BASE_URL="http://localhost:3000"
API_BASE="$BASE_URL/api/v1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Test function
run_test() {
    local test_name="$1"
    local command="$2"
    
    echo -n "🔍 Testing $test_name... "
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((FAILED++))
        echo "   Command: $command"
        eval "$command" 2>&1 | head -3 | sed 's/^/   /'
        return 1
    fi
}

echo ""
echo "📊 Infrastructure Tests"
echo "----------------------"

# Test 1: Server Health
run_test "Server Health" "curl -s --max-time 5 '$BASE_URL/health' | grep -q '\"success\":true'"

# Test 2: Root Endpoint
run_test "Root Endpoint" "curl -s --max-time 5 '$BASE_URL' | grep -q '\"success\":true'"

# Test 3: 404 Handling
run_test "404 Error Handling" "curl -s --max-time 5 '$API_BASE/nonexistent' | grep -q '404\\|\"success\":false'"

echo ""
echo "📂 Category Tests"
echo "----------------"

# Test 4: Get Categories
run_test "Get Categories" "curl -s --max-time 5 '$API_BASE/categories' | grep -q '\"success\":true'"

# Test 5: Category Hierarchy
run_test "Category Hierarchy" "curl -s --max-time 5 '$API_BASE/categories/hierarchy' | grep -q '\"success\":true'"

echo ""
echo "📦 Product Tests"
echo "---------------"

# Test 6: Get Products
run_test "Get Products" "curl -s --max-time 5 '$API_BASE/products' | grep -q '\"success\":true'"

# Test 7: Product Search
run_test "Product Search" "curl -s --max-time 5 '$API_BASE/products/search?q=phone' | grep -q '\"success\":true'"

echo ""
echo "🔐 Authentication Tests"
echo "----------------------"

# Generate unique email
TIMESTAMP=$(date +%s)
EMAIL="test.${TIMESTAMP}@example.com"
PASSWORD="Password123!"

# Test 8: User Registration
echo -n "🔍 Testing User Registration... "
REG_RESPONSE=$(curl -s --max-time 10 -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"confirmPassword\": \"$PASSWORD\"
  }")

if echo "$REG_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
    
    # Test 9: User Login
    echo -n "🔍 Testing User Login... "
    LOGIN_RESPONSE=$(curl -s --max-time 10 -X POST "$API_BASE/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$EMAIL\",
        \"password\": \"$PASSWORD\"
      }")
    
    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
        
        # Extract token
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$TOKEN" ]; then
            # Test 10: Protected Endpoint
            echo -n "🔍 Testing Protected Endpoint... "
            PROFILE_RESPONSE=$(curl -s --max-time 10 -H "Authorization: Bearer $TOKEN" "$API_BASE/auth/me")
            
            if echo "$PROFILE_RESPONSE" | grep -q '"success":true'; then
                echo -e "${GREEN}✅ PASSED${NC}"
                ((PASSED++))
            else
                echo -e "${RED}❌ FAILED${NC}"
                ((FAILED++))
                echo "   Response: $(echo $PROFILE_RESPONSE | head -c 100)..."
            fi
            
            # Test 11: Cart Access
            echo -n "🔍 Testing Cart Access... "
            CART_RESPONSE=$(curl -s --max-time 10 -H "Authorization: Bearer $TOKEN" "$API_BASE/cart")
            
            if echo "$CART_RESPONSE" | grep -q '"success":true'; then
                echo -e "${GREEN}✅ PASSED${NC}"
                ((PASSED++))
            else
                echo -e "${RED}❌ FAILED${NC}"
                ((FAILED++))
                echo "   Response: $(echo $CART_RESPONSE | head -c 100)..."
            fi
        else
            echo -e "${RED}❌ FAILED - No token received${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((FAILED++))
        echo "   Response: $(echo $LOGIN_RESPONSE | head -c 100)..."
    fi
else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED++))
    echo "   Response: $(echo $REG_RESPONSE | head -c 100)..."
fi

echo ""
echo "🛒 Cart Tests (Guest)"
echo "--------------------"

# Test 12: Guest Cart Access
run_test "Guest Cart Access" "curl -s --max-time 5 '$API_BASE/cart' | grep -q '\"success\":true'"

echo ""
echo "📊 RESULTS SUMMARY"
echo "=================="
TOTAL=$((PASSED + FAILED))
echo "Total Tests: $TOTAL"
echo -e "✅ Passed: ${GREEN}$PASSED${NC}"
echo -e "❌ Failed: ${RED}$FAILED${NC}"

if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED * 100) / TOTAL ))
    echo "📈 Success Rate: ${SUCCESS_RATE}%"
    
    echo ""
    echo "🎯 PHASE 6 READINESS:"
    if [ $SUCCESS_RATE -ge 90 ]; then
        echo -e "${GREEN}✅ READY FOR PHASE 6${NC} - All critical functionality working"
    elif [ $SUCCESS_RATE -ge 75 ]; then
        echo -e "${YELLOW}⚠️  MOSTLY READY${NC} - Some minor issues need attention"
    else
        echo -e "${RED}❌ NOT READY${NC} - Major issues need to be resolved"
    fi
else
    echo "❌ No tests completed"
fi

echo ""
echo "📄 Test completed at $(date)"
