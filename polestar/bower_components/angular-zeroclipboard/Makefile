NODE ?=

build:
	@$(NODE) ./node_modules/.bin/uglifyjs \
		src/angular-zeroclipboard.js -o dist/angular-zeroclipboard.min.js \
		--source-map dist/angular-zeroclipboard.min.map -c -m sort

.PHONY: build
