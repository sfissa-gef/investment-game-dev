# Investment Game — developer shortcuts.
#
# Override defaults on the command line if needed, e.g.:
#   make wiki-push WIKI_DIR=../my-custom-wiki-clone

WIKI_DIR ?= ../investment-game.wiki
APP_DIR  := investment-game

.DEFAULT_GOAL := help

.PHONY: help dev test build deploy wiki wiki-push server

help:
	@echo ""
	@echo "  make dev          Start PWA dev server (http://localhost:5173)"
	@echo "  make test         Run Vitest suite (47 tests)"
	@echo "  make build        Production PWA build → investment-game/dist"
	@echo "  make deploy       Build + deploy to Cloudflare Pages production"
	@echo ""
	@echo "  make wiki         Regenerate GitHub Wiki from docs/ into \$$(WIKI_DIR)"
	@echo "                    (default: ../investment-game.wiki)"
	@echo "  make wiki-push    Regenerate + commit + push to GitHub Wiki"
	@echo ""
	@echo "  make server       Start local sync backend via docker compose"
	@echo ""

dev:
	cd $(APP_DIR) && npm run dev

test:
	cd $(APP_DIR) && npm test

build:
	cd $(APP_DIR) && npm run build

deploy: build
	cd $(APP_DIR) && npx wrangler pages deploy dist \
	  --project-name=investment-game \
	  --branch=app-game-gef-production

wiki:
	@./scripts/build-wiki.sh "$(WIKI_DIR)"

wiki-push: wiki
	@cd "$(WIKI_DIR)" && \
	  git add . && \
	  if git diff --cached --quiet; then \
	    echo "↪ wiki already up to date, nothing to push"; \
	  else \
	    git commit -m "Sync wiki from docs/" && \
	    git push && \
	    echo "✓ wiki pushed"; \
	  fi

server:
	cd investment-game-server && docker compose up -d && docker compose exec app npm run migrate
