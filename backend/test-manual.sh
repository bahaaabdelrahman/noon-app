#!/bin/bash

# E-Commerce Backend Manual Testing Script
echo "🧪 Manual E-Commerce Backend Testing"
echo "===================================="

BASE_URL="http://localhost:3000"
API_BASE="$BASE_URL/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local headers="$5"
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        if [ -n "$headers" ]; then
            response=$(curl -s -w "%{http_code}" -H "$headers" "$url")
        else
            response=$(curl -s -w "%{http_code}" "$url")
        fi
    elif [ "$method" = "POST" ]; then
        if [ -n "$headers" ]; then
            response=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" -H "$headers" -d "$data" "$url")
        else
            response=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$url")
        fi
    fi
    
    # Extract status code (last 3 characters)
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [[ "$status_code" -ge 200 && "$status_code" -lt 300 ]]; then
        echo -e "${GREEN}✅ PASS${NC} ($status_code)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} ($status_code)"
        if [ ${#response_body} -gt 0 ] && [ ${#response_body} -lt 200 ]; then
            echo "    Response: $response_body"
        fi
        return 1
    fi
}

echo ""
echo "1. Infrastructure Tests"
echo "----------------------"

# Test 1: Health Check
test_endpoint "Health Check" "GET" "$BASE_URL/health"

echo ""
echo "2. Public Endpoints"
echo "------------------"

# Test 2: Get Categories
test_endpoint "Get Categories" "GET" "$API_BASE/categories"

# Test 3: Get Products
test_endpoint "Get Products" "GET" "$API_BASE/products"

echo ""
echo "3. Authentication Flow"
echo "---------------------"

# Generate unique user data
TIMESTAMP=$(date +%s)
USER_EMAIL="test.manual.$TIMESTAMP@example.com"
USER_DATA="{\"firstName\":\"Manual\",\"lastName\":\"Test\",\"email\":\"$USER_EMAIL\",\"password\":\"Password123!\",\"confirmPassword\":\"Password123!\"}"

# Test 4: User Registration
test_endpoint "User Registration" "POST" "$API_BASE/auth/register" "$USER_DATA"

# Test 5: User Login and capture token
echo -n "Testing User Login... "
LOGIN_DATA="{\"email\":\"$USER_EMAIL\",\"password\":\"Password123!\"}"
login_response=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$LOGIN_DATA" "$API_BASE/auth/login")
login_status="${login_response: -3}"
login_body="${login_response%???}"

if [[ "$login_status" -ge 200 && "$login_status" -lt 300 ]]; then
    echo -e "${GREEN}✅ PASS${NC} ($login_status)"
    
    # Extract token (basic approach)
    TOKEN=$(echo "$login_body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        echo "    Token captured: ${TOKEN:0:20}..."
        
        echo ""
        echo "4. Protected Endpoints"
        echo "---------------------"
        
        # Test 6: Get current user info
        test_endpoint "Get User Profile" "GET" "$API_BASE/auth/me" "" "Authorization: Bearer $TOKEN"
        
        # Test 7: Get user cart
        test_endpoint "Get User Cart" "GET" "$API_BASE/cart" "" "Authorization: Bearer $TOKEN"
        
        echo ""
        echo "5. Cart Operations"
        echo "-----------------"
        
        # Get a product ID first
        products_response=$(curl -s "$API_BASE/products")
        PRODUCT_ID=$(echo "$products_response" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        if [ -n "$PRODUCT_ID" ]; then
            echo "Using Product ID: $PRODUCT_ID"
            
            # Test 8: Add to cart
            CART_DATA="{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}"
            test_endpoint "Add to Cart" "POST" "$API_BASE/cart/items" "$CART_DATA" "Authorization: Bearer $TOKEN"
            
            # Test 9: Get cart summary
            test_endpoint "Get Cart Summary" "GET" "$API_BASE/cart/summary" "" "Authorization: Bearer $TOKEN"
        else
            echo -e "${YELLOW}⚠️ SKIP${NC} - No products available for cart testing"
        fi
        
    else
        echo -e "${RED}❌ FAIL${NC} - Could not extract token"
    fi
else
    echo -e "${RED}❌ FAIL${NC} ($login_status)"
fi

echo ""
echo "6. Error Handling Tests"
echo "----------------------"

# Test 10: Unauthorized access
echo -n "Testing Unauthorized Access... "
unauth_response=$(curl -s -w "%{http_code}" "$API_BASE/auth/me")
unauth_status="${unauth_response: -3}"
if [[ "$unauth_status" == "401" ]]; then
    echo -e "${GREEN}✅ PASS${NC} (401 - Correctly blocked)"
else
    echo -e "${RED}❌ FAIL${NC} ($unauth_status - Should be 401)"
fi

# Test 11: Invalid endpoint
echo -n "Testing Invalid Endpoint... "
invalid_response=$(curl -s -w "%{http_code}" "$API_BASE/nonexistent")
invalid_status="${invalid_response: -3}"
if [[ "$invalid_status" == "404" ]]; then
    echo -e "${GREEN}✅ PASS${NC} (404 - Correctly not found)"
else
    echo -e "${RED}❌ FAIL${NC} ($invalid_status - Should be 404)"
fi

echo ""
echo "===================================="
echo "🏁 Manual Testing Complete"
echo "===================================="
