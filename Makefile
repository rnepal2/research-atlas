PYTHON ?= python3

.PHONY: data-refresh data-sync validate-data

data-refresh:
	./src/refresh_data.sh

data-sync:
	$(PYTHON) src/scripts/sync_public_data.py

validate-data:
	$(PYTHON) src/scripts/validate_static_data.py
