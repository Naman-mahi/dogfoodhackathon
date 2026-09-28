.PHONY: build up down restart test

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose down
	docker compose up -d --build

test:
	python run.py .dogfood.toml
