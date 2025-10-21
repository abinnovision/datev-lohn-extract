#!/bin/bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 <app-name>"
    echo ""
    echo "Available apps:"
    if [ -d "apps" ]; then
        for app_dir in apps/*/; do
            if [ -d "$app_dir" ]; then
                app_name=$(basename "$app_dir")
                echo "  - $app_name"
            fi
        done
    else
        echo "  (No apps directory found)"
    fi
    echo ""
    echo "Example: $0 webhooks"
}

# Check if app name is provided
if [ $# -eq 0 ]; then
    print_error "No app name provided"
    show_usage
    exit 1
fi

APP_NAME="$1"

# Check if we're in the repository root
if [ ! -f "package.json" ] || [ ! -f ".tool-versions" ] || [ ! -d "apps" ]; then
    print_error "This script must be run from the repository root directory"
    exit 1
fi

# Check if app directory exists and validate app name
APP_DIR="apps/$APP_NAME"
if [ ! -d "$APP_DIR" ]; then
    print_error "App directory not found: $APP_DIR"
    exit 1
fi

print_info "Building app: $APP_NAME"

# Validate Node.js version
REQUIRED_NODE_VERSION=$(grep "nodejs" .tool-versions | awk '{print $2}')
if [ -z "$REQUIRED_NODE_VERSION" ]; then
    print_error "Could not find Node.js version in .tool-versions"
    exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    print_error "Node.js is not available"
    exit 1
fi

CURRENT_NODE_VERSION=$(node --version | sed 's/v//')
if [ "$CURRENT_NODE_VERSION" != "$REQUIRED_NODE_VERSION" ]; then
    print_error "Node.js version mismatch. Required: $REQUIRED_NODE_VERSION, Current: $CURRENT_NODE_VERSION"
    print_info "Please use Node.js $REQUIRED_NODE_VERSION (hint: use asdf)"
    exit 1
fi

print_success "Node.js version validated: $CURRENT_NODE_VERSION"

# Validate yarn is available
if ! command -v yarn &> /dev/null; then
    print_error "Yarn is not available"
    exit 1
fi

YARN_VERSION=$(yarn --version)
print_success "Yarn is available: $YARN_VERSION"

# Get turbo version from package.json
if ! command -v jq &> /dev/null; then
    print_error "jq is not installed. Please install jq to parse JSON"
    exit 1
fi

TURBO_VERSION=$(jq -r '.devDependencies.turbo' package.json)
if [ "$TURBO_VERSION" = "null" ] || [ -z "$TURBO_VERSION" ]; then
    print_error "Could not find turbo version in package.json devDependencies"
    exit 1
fi

print_success "Turbo version: $TURBO_VERSION"

# Determine the scope name based on app name
# Convert hyphens to match the package naming convention
SCOPE_NAME="@internal/app-$APP_NAME"

# Create app-specific output directory
OUTPUT_DIR="out/$APP_NAME"
print_info "Creating output directory: $OUTPUT_DIR"

# Clean up existing output directory for this app
if [ -d "$OUTPUT_DIR" ]; then
    print_warning "Removing existing output directory: $OUTPUT_DIR"
    rm -rf "$OUTPUT_DIR"
fi

# Create the output directory
mkdir -p "$OUTPUT_DIR"

print_info "Running turbo prune for scope: $SCOPE_NAME"

if ! yarn dlx turbo@"$TURBO_VERSION" prune --scope="$SCOPE_NAME" --docker --out-dir="$OUTPUT_DIR"; then
    print_error "Turbo prune failed"
    exit 1
fi

print_success "Turbo prune completed successfully"

# Verify the output directory structure
if [ ! -d "$OUTPUT_DIR" ]; then
    print_error "Expected output directory was not created: $OUTPUT_DIR"
    exit 1
fi

if [ ! -d "$OUTPUT_DIR/json" ] || [ ! -d "$OUTPUT_DIR/full" ]; then
    print_error "Expected 'json' and 'full' directories were not created in $OUTPUT_DIR"
    exit 1
fi

# Export build information for use in CI/CD
echo "NODE_VERSION=$REQUIRED_NODE_VERSION" >> "$OUTPUT_DIR/build.env"
echo "TURBO_VERSION=$TURBO_VERSION" >> "$OUTPUT_DIR/build.env"
echo "APP_NAME=$APP_NAME" >> "$OUTPUT_DIR/build.env"
echo "SCOPE_NAME=$SCOPE_NAME" >> "$OUTPUT_DIR/build.env"

print_success "Build environment variables saved to: $OUTPUT_DIR/build.env"
print_success "Build preparation completed successfully for $APP_NAME"
