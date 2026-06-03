PYTHON ?= python3

.PHONY: data-refresh data-sync validate-data

data-refresh:
	$(PYTHON) scripts/refresh_data.py

data-sync:
	$(PYTHON) scripts/sync_public_data.py

validate-data:
	$(PYTHON) scripts/validate_static_data.py
