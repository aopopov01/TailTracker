#!/bin/bash
# TailTracker Docker Development Helper
# Usage: ./docker-dev.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

COMPOSE_FILE="docker-compose.dev.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  TailTracker Docker Helper${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

case "$1" in
    # Start all services
    up|start)
        print_header
        echo "Starting development containers..."
        docker compose -f $COMPOSE_FILE up -d --build
        print_success "Containers started!"
        echo ""
        echo "  Web App:   http://localhost:4000"
        echo "  Admin:     http://localhost:4001"
        echo ""
        echo "View logs: ./docker-dev.sh logs"
        ;;

    # Stop all services
    down|stop)
        print_header
        echo "Stopping development containers..."
        docker compose -f $COMPOSE_FILE down
        print_success "Containers stopped!"
        ;;

    # Restart services
    restart)
        print_header
        echo "Restarting development containers..."
        docker compose -f $COMPOSE_FILE down
        docker compose -f $COMPOSE_FILE up -d --build
        print_success "Containers restarted!"
        ;;

    # View logs
    logs)
        if [ -z "$2" ]; then
            docker compose -f $COMPOSE_FILE logs -f
        else
            docker compose -f $COMPOSE_FILE logs -f "$2"
        fi
        ;;

    # Build without starting
    build)
        print_header
        echo "Building development containers..."
        docker compose -f $COMPOSE_FILE build --no-cache
        print_success "Build complete!"
        ;;

    # Clean up everything
    clean)
        print_header
        print_warning "This will remove all TailTracker containers, images, and volumes!"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Stopping containers..."
            docker compose -f $COMPOSE_FILE down -v --rmi local

            echo "Removing orphan containers..."
            docker container prune -f --filter "label=com.docker.compose.project=tailtracker"

            print_success "Cleanup complete!"
        else
            print_warning "Cleanup cancelled."
        fi
        ;;

    # Show status
    status|ps)
        print_header
        echo "Container Status:"
        echo ""
        docker compose -f $COMPOSE_FILE ps
        ;;

    # Shell into container
    shell|exec)
        if [ -z "$2" ]; then
            print_error "Please specify a service (web or admin)"
            echo "Usage: ./docker-dev.sh shell web"
            exit 1
        fi
        docker compose -f $COMPOSE_FILE exec "$2" sh
        ;;

    # Run web only
    web)
        print_header
        echo "Starting web container only..."
        docker compose -f $COMPOSE_FILE up -d --build web
        print_success "Web container started at http://localhost:4000"
        ;;

    # Run admin only
    admin)
        print_header
        echo "Starting admin container only..."
        docker compose -f $COMPOSE_FILE up -d --build admin
        print_success "Admin container started at http://localhost:4001"
        ;;

    # Production build
    prod)
        print_header
        echo "Building production images..."

        echo "Building web production image..."
        docker build -f apps/web/Dockerfile --target production -t tailtracker/web:latest .

        echo "Building admin production image..."
        docker build -f apps/admin/Dockerfile --target production -t tailtracker/admin:latest .

        print_success "Production images built!"
        echo ""
        echo "Images created:"
        echo "  - tailtracker/web:latest"
        echo "  - tailtracker/admin:latest"
        echo ""
        echo "To run production: ./docker-dev.sh prod-up"
        ;;

    # Start production containers
    prod-up)
        print_header
        echo "Starting production containers..."
        docker compose -f $COMPOSE_PROD_FILE up -d
        print_success "Production containers started!"
        echo ""
        echo "  Web App:   http://localhost:80"
        echo "  Admin:     http://localhost:8080"
        ;;

    # Stop production containers
    prod-down)
        print_header
        echo "Stopping production containers..."
        docker compose -f $COMPOSE_PROD_FILE down
        print_success "Production containers stopped!"
        ;;

    # View production logs
    prod-logs)
        if [ -z "$2" ]; then
            docker compose -f $COMPOSE_PROD_FILE logs -f
        else
            docker compose -f $COMPOSE_PROD_FILE logs -f "$2"
        fi
        ;;

    # Production status
    prod-status)
        print_header
        echo "Production Container Status:"
        echo ""
        docker compose -f $COMPOSE_PROD_FILE ps
        ;;

    # Help
    help|--help|-h|"")
        print_header
        echo "Usage: ./docker-dev.sh [command]"
        echo ""
        echo "Development Commands:"
        echo "  up, start      Start all development containers"
        echo "  down, stop     Stop all containers"
        echo "  restart        Restart all containers"
        echo "  logs [svc]     View logs (optionally for specific service)"
        echo "  build          Build containers without starting"
        echo "  clean          Remove all containers, images, and volumes"
        echo "  status, ps     Show container status"
        echo "  shell <svc>    Open shell in container (web or admin)"
        echo "  web            Start only web container"
        echo "  admin          Start only admin container"
        echo ""
        echo "Production Commands:"
        echo "  prod           Build production images"
        echo "  prod-up        Start production containers"
        echo "  prod-down      Stop production containers"
        echo "  prod-logs      View production logs"
        echo "  prod-status    Show production container status"
        echo ""
        echo "Other:"
        echo "  help           Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./docker-dev.sh up        # Start development environment"
        echo "  ./docker-dev.sh logs web  # View web container logs"
        echo "  ./docker-dev.sh shell web # Shell into web container"
        ;;

    *)
        print_error "Unknown command: $1"
        echo "Run './docker-dev.sh help' for usage information."
        exit 1
        ;;
esac
