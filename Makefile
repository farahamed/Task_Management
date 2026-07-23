.PHONY: install dev build test e2e migrate seed docker-up docker-down

install:
	npm install

dev:
	npm run start:dev

build:
	npm run build

test:
	npm run test

e2e:
	npx dotenv -e .env.test -- npx jest --config test/jest-e2e.json --runInBand

migrate:
	npx prisma migrate deploy

seed:
	npx ts-node prisma/seed.ts

docker-up:
	docker compose up --build

docker-down:
	docker compose down