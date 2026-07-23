/**
 * Prisma seed script — populates the database with realistic sample data.
 *
 * Usage:
 *   npx ts-node prisma/seed.ts
 *   -- or --
 *   npx prisma db seed          (if "prisma.seed" is set in package.json)
 *
 * Add to package.json:
 *   "prisma": {
 *     "seed": "ts-node prisma/seed.ts"
 *   }
 *
 * Credentials created:
 *   alice@example.com / Password123!
 *   bob@example.com   / Password123!
 */

import { PrismaClient, TaskPriority, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysFromNow(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() + days);
	// Zero out the time portion so it stores as a clean date
	d.setHours(0, 0, 0, 0);
	return d;
}

// ─── seed ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
	console.log('  Seeding database...\n');

	// ── wipe existing data (order matters for FK constraints) ────────────────
	await prisma.task.deleteMany();
	await prisma.project.deleteMany();
	await prisma.user.deleteMany();
	console.log('  Cleared existing data.');

	// ── users ────────────────────────────────────────────────────────────────
	const PASSWORD_HASH = await bcrypt.hash('Password123!', 12);

	const [alice, bob] = await Promise.all([
		prisma.user.create({
			data: { name: 'Alice Johnson', email: 'alice@example.com', password: PASSWORD_HASH },
		}),
		prisma.user.create({
			data: { name: 'Bob Smith', email: 'bob@example.com', password: PASSWORD_HASH },
		}),
	]);
	console.log(`  Created users: ${alice.email}, ${bob.email}`);

	// ── projects ─────────────────────────────────────────────────────────────
	const [backendApi, frontendDash, devOps, mobileApp] = await Promise.all([
		prisma.project.create({
			data: {
				userId: alice.id,
				name: 'Backend Internship',
				description: 'Task Management REST API built with NestJS, Prisma, and PostgreSQL.',
			},
		}),
		prisma.project.create({
			data: {
				userId: alice.id,
				name: 'Frontend Dashboard',
				description: 'React-based admin dashboard consuming the task management API.',
			},
		}),
		prisma.project.create({
			data: {
				userId: bob.id,
				name: 'DevOps Setup',
				description: 'Docker, CI/CD pipelines, and infrastructure automation.',
			},
		}),
		prisma.project.create({
			data: {
				userId: bob.id,
				name: 'Mobile App',
				description: 'React Native companion app for managing tasks on the go.',
			},
		}),
	]);
	console.log(
		`  Created projects: ${backendApi.name}, ${frontendDash.name}, ${devOps.name}, ${mobileApp.name}`,
	);

	// ── tasks for "Backend Internship" (alice) ────────────────────────────────
	await prisma.task.createMany({
		data: [
			{
				projectId: backendApi.id,
				title: 'Implement JWT authentication',
				description: 'Set up Passport JWT strategy with access tokens. Hash passwords with bcrypt (cost 12).',
				status: TaskStatus.DONE,
				priority: TaskPriority.HIGH,
				dueDate: daysFromNow(1),
			},
			{
				projectId: backendApi.id,
				title: 'Design database schema',
				description: 'Model User, Project, and Task with soft deletes, indexes, and constraints in Prisma schema.',
				status: TaskStatus.DONE,
				priority: TaskPriority.HIGH,
				dueDate: daysFromNow(2),
			},
			{
				projectId: backendApi.id,
				title: 'Add integration tests',
				description: 'Write E2E tests using @nestjs/testing and supertest covering full lifecycle flows.',
				status: TaskStatus.IN_PROGRESS,
				priority: TaskPriority.HIGH,
				dueDate: daysFromNow(5),
			},
			{
				projectId: backendApi.id,
				title: 'Add search to task endpoints',
				description: 'Implement case-insensitive full-text search via ?q= across task title and description.',
				status: TaskStatus.IN_PROGRESS,
				priority: TaskPriority.MEDIUM,
				dueDate: daysFromNow(7),
			},
			{
				projectId: backendApi.id,
				title: 'Write seed script',
				description: 'Populate the database with realistic sample data for easy manual testing.',
				status: TaskStatus.TODO,
				priority: TaskPriority.MEDIUM,
				dueDate: daysFromNow(10),
			},
			{
				projectId: backendApi.id,
				title: 'Write unit tests for ProjectsService',
				description: 'Cover create, findAll, findOne, update, and remove — including all error branches.',
				status: TaskStatus.TODO,
				priority: TaskPriority.MEDIUM,
				dueDate: daysFromNow(12),
			},
			{
				projectId: backendApi.id,
				title: 'Write comprehensive README',
				description:
					'Document setup steps, all API endpoints with request/response examples, schema rationale, and test instructions.',
				status: TaskStatus.TODO,
				priority: TaskPriority.LOW,
				dueDate: daysFromNow(20),
			},
		],
	});

	// ── tasks for "Frontend Dashboard" (alice) ────────────────────────────────
	await prisma.task.createMany({
		data: [
			{
				projectId: frontendDash.id,
				title: 'Bootstrap React project with Vite',
				description: 'Set up TypeScript, ESLint, Prettier, and folder structure.',
				status: TaskStatus.DONE,
				priority: TaskPriority.HIGH,
				dueDate: daysFromNow(1),
			},
			{
				projectId: frontendDash.id,
				title: 'Build paginated task list component',
				description: 'Filterable, sortable data table with pagination controls.',
				status: TaskStatus.IN_PROGRESS,
				priority: TaskPriority.MEDIUM,
				dueDate: daysFromNow(14),
			},
			{
				projectId: frontendDash.id,
				title: 'Implement task search bar',
				description: 'Debounced input that hits the ?q= API endpoint.',
				status: TaskStatus.TODO,
				priority: TaskPriority.MEDIUM,
				dueDate: daysFromNow(21),
			},
			{
				projectId: frontendDash.id,
				title: 'Add authentication flow',
				description: 'Login page, JWT storage, and protected routes.',
				status: TaskStatus.TODO,
				priority: TaskPriority.HIGH,
				dueDate: daysFromNow(18),
			},
		],
	});

	// ── tasks for "DevOps Setup" (bob) ────────────────────────────────────────
	await prisma.task.createMany({
		data: [
			{
				projectId: devOps.id,
				title: 'Write Dockerfile',
				description: 'Multi-stage build: builder stage compiles TS, runner stage copies the dist bundle.',
				status: TaskStatus.DONE,
				priority: TaskPriority.HIGH,
				dueDate: daysFromNow(1),
			},
			{
				projectId: devOps.id,
				title: 'Write docker-compose.yml',
				description: 'Compose file for the API and a Postgres service with health checks.',
				status: TaskStatus.DONE,
				priority: TaskPriority.HIGH,
				dueDate: daysFromNow(2),
			},
			{
				projectId: devOps.id,
				title: 'Configure GitHub Actions CI',
				description: 'Pipeline: lint → unit tests → build → Docker push.',
				status: TaskStatus.IN_PROGRESS,
				priority: TaskPriority.MEDIUM,
				dueDate: daysFromNow(15),
			},
			{
				projectId: devOps.id,
				title: 'Add Makefile convenience commands',
				description: 'make dev, make test, make migrate, make seed targets.',
				status: TaskStatus.TODO,
				priority: TaskPriority.LOW,
				dueDate: daysFromNow(30),
			},
		],
	});

	// ── tasks for "Mobile App" (bob) ──────────────────────────────────────────
	await prisma.task.createMany({
		data: [
			{
				projectId: mobileApp.id,
				title: 'Initialize React Native project',
				description: 'Use Expo managed workflow with TypeScript template.',
				status: TaskStatus.TODO,
				priority: TaskPriority.HIGH,
				dueDate: daysFromNow(10),
			},
			{
				projectId: mobileApp.id,
				title: 'Integrate API client',
				description: 'Axios instance with JWT interceptor for authenticated requests.',
				status: TaskStatus.TODO,
				priority: TaskPriority.MEDIUM,
				dueDate: daysFromNow(25),
			},
		],
	});

	// ── summary ───────────────────────────────────────────────────────────────
	const [userCount, projectCount, taskCount] = await Promise.all([
		prisma.user.count(),
		prisma.project.count(),
		prisma.task.count(),
	]);

	console.log(`\n  Seeded: ${userCount} users · ${projectCount} projects · ${taskCount} tasks`);
	console.log('\n  Test credentials:');
	console.log('    alice@example.com  /  Password123!');
	console.log('    bob@example.com    /  Password123!');
	console.log('\n🎉  Done!\n');
}

main()
	.catch((err) => {
		console.error(' Seed failed:', err);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
