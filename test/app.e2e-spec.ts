import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

// ─── helpers ─────────────────────────────────────────────────────────────────

type AuthHeaders = { Authorization: string };

function authHeader(token: string): AuthHeaders {
	return { Authorization: `Bearer ${token}` };
}

async function registerAndLogin(
	app: INestApplication,
	email: string,
	password = 'Password123!',
	name = 'Test User',
): Promise<string> {
	await request(app.getHttpServer()).post('/api/auth/register').send({ name, email, password });
	const res = await request(app.getHttpServer())
		.post('/api/auth/login')
		.send({ email, password });
	return res.body.access_token as string;
}

// One year in the future — always a valid due date during test runs
function futureDate(daysFromNow = 365): string {
	const d = new Date();
	d.setDate(d.getDate() + daysFromNow);
	return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
}

// ─── suite ───────────────────────────────────────────────────────────────────

describe('Task Management API (e2e)', () => {
	let app: INestApplication;
	let prisma: PrismaService;

	// Primary test user
	const PRIMARY_EMAIL = 'e2e-primary@example.com';
	let token: string;

	// ── app bootstrap ───────────────────────────────────────────────────────
	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();

		// Mirror the global config from main.ts exactly
		app.setGlobalPrefix('api');
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true,
				transformOptions: { enableImplicitConversion: true },
			}),
		);
		app.useGlobalFilters(new AllExceptionsFilter());

		prisma = moduleFixture.get<PrismaService>(PrismaService);
		await app.init();
	});

	afterAll(async () => {
		await prisma.task.deleteMany();
		await prisma.project.deleteMany();
		await prisma.user.deleteMany();
		await app.close();
	});

	// Wipe and re-create the primary user before every test so tests are isolated
	beforeEach(async () => {
		await prisma.task.deleteMany();
		await prisma.project.deleteMany();
		await prisma.user.deleteMany();
		token = await registerAndLogin(app, PRIMARY_EMAIL);
	});

	// ══════════════════════════════════════════════════════════════════════════
	// Flow 1 — Full project lifecycle with cascading soft delete
	// Create project → Add task → Mark done → Delete project → verify cascade
	// ══════════════════════════════════════════════════════════════════════════
	describe('Flow 1: Full project lifecycle with cascade soft delete', () => {
		it('walks the complete lifecycle: create → task → done → delete → verify cascade', async () => {
			// 1. Create project
			const projectRes = await request(app.getHttpServer())
				.post('/api/projects')
				.set(authHeader(token))
				.send({ name: 'Backend Internship', description: 'REST API project' })
				.expect(201);

			expect(projectRes.body).toMatchObject({
				id: expect.any(String),
				name: 'Backend Internship',
				description: 'REST API project',
				created_at: expect.any(String),
			});
			const projectId: string = projectRes.body.id;

			// 2. Add a task under the project
			const taskRes = await request(app.getHttpServer())
				.post(`/api/projects/${projectId}/tasks`)
				.set(authHeader(token))
				.send({
					title: 'Implement JWT',
					description: 'Use Passport JWT strategy',
					priority: 'high',
					status: 'todo',
					due_date: futureDate(),
				})
				.expect(201);

			expect(taskRes.body).toMatchObject({
				id: expect.any(String),
				title: 'Implement JWT',
				status: 'todo',
				priority: 'high',
			});
			const taskId: string = taskRes.body.id;

			// 3. Mark the task as done
			const updateRes = await request(app.getHttpServer())
				.put(`/api/tasks/${taskId}`)
				.set(authHeader(token))
				.send({ status: 'done' })
				.expect(200);

			expect(updateRes.body.status).toBe('done');

			// Verify persisted
			const getTaskRes = await request(app.getHttpServer())
				.get(`/api/tasks/${taskId}`)
				.set(authHeader(token))
				.expect(200);
			expect(getTaskRes.body.status).toBe('done');

			// 4. Delete the project
			const deleteRes = await request(app.getHttpServer())
				.delete(`/api/projects/${projectId}`)
				.set(authHeader(token))
				.expect(200);

			expect(deleteRes.body).toEqual({ message: 'Project deleted successfully.' });

			// 5. Project is now gone
			await request(app.getHttpServer())
				.get(`/api/projects/${projectId}`)
				.set(authHeader(token))
				.expect(404);

			// 6. Task is also cascade-deleted (soft)
			await request(app.getHttpServer())
				.get(`/api/tasks/${taskId}`)
				.set(authHeader(token))
				.expect(404);
		});

		it('rejects creating a task with a past due date', async () => {
			const projectRes = await request(app.getHttpServer())
				.post('/api/projects')
				.set(authHeader(token))
				.send({ name: 'Date Validation Project' })
				.expect(201);

			await request(app.getHttpServer())
				.post(`/api/projects/${projectRes.body.id}/tasks`)
				.set(authHeader(token))
				.send({ title: 'Past Task', due_date: '2020-06-15' })
				.expect(400);
		});

		it('rejects updating a task with a past due date', async () => {
			const projectRes = await request(app.getHttpServer())
				.post('/api/projects')
				.set(authHeader(token))
				.send({ name: 'Update Validation Project' })
				.expect(201);

			const taskRes = await request(app.getHttpServer())
				.post(`/api/projects/${projectRes.body.id}/tasks`)
				.set(authHeader(token))
				.send({ title: 'My Task', due_date: futureDate(10) })
				.expect(201);

			await request(app.getHttpServer())
				.put(`/api/tasks/${taskRes.body.id}`)
				.set(authHeader(token))
				.send({ due_date: '2020-06-15' })
				.expect(400);
		});

		it('rejects duplicate project names for the same user', async () => {
			await request(app.getHttpServer())
				.post('/api/projects')
				.set(authHeader(token))
				.send({ name: 'Unique Project' })
				.expect(201);

			await request(app.getHttpServer())
				.post('/api/projects')
				.set(authHeader(token))
				.send({ name: 'Unique Project' })
				.expect(409);
		});

		it('allows done → todo transition and returns 200 (unusual but allowed)', async () => {
			const projectRes = await request(app.getHttpServer())
				.post('/api/projects')
				.set(authHeader(token))
				.send({ name: 'Transition Project' })
				.expect(201);

			const taskRes = await request(app.getHttpServer())
				.post(`/api/projects/${projectRes.body.id}/tasks`)
				.set(authHeader(token))
				.send({ title: 'Done Task', status: 'done', due_date: futureDate() })
				.expect(201);

			// Move back to todo — should succeed, not throw
			const revertRes = await request(app.getHttpServer())
				.put(`/api/tasks/${taskRes.body.id}`)
				.set(authHeader(token))
				.send({ status: 'todo' })
				.expect(200);

			expect(revertRes.body.status).toBe('todo');
		});

		it('returns 404 when deleting a project that does not exist', async () => {
			await request(app.getHttpServer())
				.delete('/api/projects/00000000-0000-0000-0000-000000000000')
				.set(authHeader(token))
				.expect(404);
		});
	});

	// ══════════════════════════════════════════════════════════════════════════
	// Flow 2 — Filter tasks by status, priority, and date range
	// ══════════════════════════════════════════════════════════════════════════
	describe('Flow 2: Filter and sort tasks', () => {
		let projectId: string;

		beforeEach(async () => {
			// Create a project and seed three varied tasks
			const p = await request(app.getHttpServer())
				.post('/api/projects')
				.set(authHeader(token))
				.send({ name: 'Filter Project' })
				.expect(201);
			projectId = p.body.id;

			await Promise.all([
				request(app.getHttpServer())
					.post(`/api/projects/${projectId}/tasks`)
					.set(authHeader(token))
					.send({
						title: 'High Priority Todo',
						priority: 'high',
						status: 'todo',
						due_date: futureDate(30),
					}),
				request(app.getHttpServer())
					.post(`/api/projects/${projectId}/tasks`)
					.set(authHeader(token))
					.send({
						title: 'Medium In Progress',
						priority: 'medium',
						status: 'in_progress',
						due_date: futureDate(20),
					}),
				request(app.getHttpServer())
					.post(`/api/projects/${projectId}/tasks`)
					.set(authHeader(token))
					.send({
						title: 'Low Priority Done',
						priority: 'low',
						status: 'done',
						due_date: futureDate(10),
					}),
			]);
		});

		it('filters GET /api/tasks by status=todo', async () => {
			const res = await request(app.getHttpServer())
				.get('/api/tasks?status=todo')
				.set(authHeader(token))
				.expect(200);

			expect(res.body.pagination.total).toBe(1);
			expect(res.body.data).toHaveLength(1);
			expect(res.body.data[0].status).toBe('todo');
		});

		it('filters GET /api/tasks by priority=high', async () => {
			const res = await request(app.getHttpServer())
				.get('/api/tasks?priority=high')
				.set(authHeader(token))
				.expect(200);

			expect(res.body.pagination.total).toBe(1);
			expect(res.body.data[0].priority).toBe('high');
		});

		it('filters GET /api/tasks by status and priority combined', async () => {
			// Only the high-priority todo task matches
			const res = await request(app.getHttpServer())
				.get('/api/tasks?status=todo&priority=high')
				.set(authHeader(token))
				.expect(200);

			expect(res.body.pagination.total).toBe(1);
			expect(res.body.data[0].status).toBe('todo');
			expect(res.body.data[0].priority).toBe('high');
		});

		it('returns empty data when no tasks match the combined filter', async () => {
			// done + high → no match
			const res = await request(app.getHttpServer())
				.get('/api/tasks?status=done&priority=high')
				.set(authHeader(token))
				.expect(200);

			expect(res.body.data).toHaveLength(0);
			expect(res.body.pagination.total).toBe(0);
			expect(res.body.pagination.totalPages).toBe(1); // always at least 1
		});

		it('filters GET /api/projects/:id/tasks by status', async () => {
			const res = await request(app.getHttpServer())
				.get(`/api/projects/${projectId}/tasks?status=in_progress`)
				.set(authHeader(token))
				.expect(200);

			expect(res.body.pagination.total).toBe(1);
			expect(res.body.data[0].status).toBe('in_progress');
		});

		it('sorts tasks by due_date ascending', async () => {
			const res = await request(app.getHttpServer())
				.get('/api/tasks?sort=due_date&order=asc')
				.set(authHeader(token))
				.expect(200);

			const dates = res.body.data.map((t: any) => new Date(t.due_date ?? t.dueDate).getTime());
			for (let i = 1; i < dates.length; i++) {
				expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
			}
		});

		it('sorts tasks by due_date descending', async () => {
			const res = await request(app.getHttpServer())
				.get('/api/tasks?sort=due_date&order=desc')
				.set(authHeader(token))
				.expect(200);

			const dates = res.body.data.map((t: any) => new Date(t.due_date ?? t.dueDate).getTime());
			for (let i = 1; i < dates.length; i++) {
				expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
			}
		});

		it('includes project name in every task returned by GET /api/tasks', async () => {
			const res = await request(app.getHttpServer())
				.get('/api/tasks')
				.set(authHeader(token))
				.expect(200);

			for (const task of res.body.data) {
				expect(task.project).toBeDefined();
				expect(typeof task.project.name).toBe('string');
				expect(task.project.name).toBe('Filter Project');
			}
		});

		it('returns correct pagination metadata', async () => {
			const res = await request(app.getHttpServer())
				.get('/api/tasks?page=1&limit=2')
				.set(authHeader(token))
				.expect(200);

			expect(res.body.pagination).toMatchObject({
				page: 1,
				limit: 2,
				total: 3,
				totalPages: 2,
			});
			expect(res.body.data).toHaveLength(2);
		});
	});

	// ══════════════════════════════════════════════════════════════════════════
	// Flow 3 — Search tasks and verify pagination
	// ══════════════════════════════════════════════════════════════════════════
	describe('Flow 3: Search tasks and verify pagination', () => {
		let projectId: string;

		beforeEach(async () => {
			const p = await request(app.getHttpServer())
				.post('/api/projects')
				.set(authHeader(token))
				.send({ name: 'Search Project' })
				.expect(201);
			projectId = p.body.id;

			// 3 tasks match "jwt" (2 by title, 1 by description)
			// 2 tasks do not match
			await Promise.all([
				request(app.getHttpServer())
					.post(`/api/projects/${projectId}/tasks`)
					.set(authHeader(token))
					.send({ title: 'Implement JWT authentication', due_date: futureDate(5) }),
				request(app.getHttpServer())
					.post(`/api/projects/${projectId}/tasks`)
					.set(authHeader(token))
					.send({ title: 'Setup JWT refresh tokens', due_date: futureDate(6) }),
				request(app.getHttpServer())
					.post(`/api/projects/${projectId}/tasks`)
					.set(authHeader(token))
					.send({
						title: 'Write unit tests',
						description: 'Cover JWT edge cases thoroughly',
						due_date: futureDate(7),
					}),
				request(app.getHttpServer())
					.post(`/api/projects/${projectId}/tasks`)
					.set(authHeader(token))
					.send({ title: 'Setup Docker', due_date: futureDate(8) }),
				request(app.getHttpServer())
					.post(`/api/projects/${projectId}/tasks`)
					.set(authHeader(token))
					.send({ title: 'Write README', due_date: futureDate(9) }),
			]);
		});

		it('returns only tasks whose title or description contains the query', async () => {
			const res = await request(app.getHttpServer())
				.get('/api/tasks?q=jwt')
				.set(authHeader(token))
				.expect(200);

			expect(res.body.pagination.total).toBe(3);

			for (const task of res.body.data) {
				const inTitle = task.title.toLowerCase().includes('jwt');
				const inDesc = (task.description ?? '').toLowerCase().includes('jwt');
				expect(inTitle || inDesc).toBe(true);
			}
		});

		it('search is case-insensitive (jwt === JWT === Jwt)', async () => {
			const [lower, upper, mixed] = await Promise.all([
				request(app.getHttpServer()).get('/api/tasks?q=jwt').set(authHeader(token)),
				request(app.getHttpServer()).get('/api/tasks?q=JWT').set(authHeader(token)),
				request(app.getHttpServer()).get('/api/tasks?q=Jwt').set(authHeader(token)),
			]);

			expect(upper.body.pagination.total).toBe(lower.body.pagination.total);
			expect(mixed.body.pagination.total).toBe(lower.body.pagination.total);
		});

		it('paginates search results correctly — page 1', async () => {
			const res = await request(app.getHttpServer())
				.get('/api/tasks?q=jwt&page=1&limit=2')
				.set(authHeader(token))
				.expect(200);

			expect(res.body.data).toHaveLength(2);
			expect(res.body.pagination).toMatchObject({
				page: 1,
				limit: 2,
				total: 3,
				totalPages: 2,
			});
		});

		it('paginates search results correctly — page 2 (remainder)', async () => {
			const res = await request(app.getHttpServer())
				.get('/api/tasks?q=jwt&page=2&limit=2')
				.set(authHeader(token))
				.expect(200);

			expect(res.body.data).toHaveLength(1);
			expect(res.body.pagination.page).toBe(2);
		});

		it('pages 1 and 2 contain no overlapping task IDs', async () => {
			const [p1, p2] = await Promise.all([
				request(app.getHttpServer()).get('/api/tasks?page=1&limit=3').set(authHeader(token)),
				request(app.getHttpServer()).get('/api/tasks?page=2&limit=3').set(authHeader(token)),
			]);

			const ids1 = new Set(p1.body.data.map((t: any) => t.id));
			for (const task of p2.body.data) {
				expect(ids1.has(task.id)).toBe(false);
			}
		});

		it('returns empty results for a non-matching query', async () => {
			const res = await request(app.getHttpServer())
				.get('/api/tasks?q=xyznonexistent')
				.set(authHeader(token))
				.expect(200);

			expect(res.body.data).toHaveLength(0);
			expect(res.body.pagination.total).toBe(0);
			expect(res.body.pagination.totalPages).toBe(1);
		});

		it('returns all tasks when q is omitted', async () => {
			const res = await request(app.getHttpServer())
				.get('/api/tasks?page=1&limit=10')
				.set(authHeader(token))
				.expect(200);

			expect(res.body.pagination.total).toBe(5);
		});
	});

	// ══════════════════════════════════════════════════════════════════════════
	// Authentication & access control
	// ══════════════════════════════════════════════════════════════════════════
	describe('Authentication and authorization', () => {
		it('rejects requests without a JWT with 401', async () => {
			await request(app.getHttpServer()).get('/api/projects').expect(401);
			await request(app.getHttpServer()).get('/api/tasks').expect(401);
		});

		it('rejects requests with an invalid JWT with 401', async () => {
			await request(app.getHttpServer())
				.get('/api/projects')
				.set('Authorization', 'Bearer not.a.valid.token')
				.expect(401);
		});

		it('returns 403 when accessing another user\'s project', async () => {
			// Create a second user and their project
			const otherToken = await registerAndLogin(app, 'e2e-other@example.com');

			const otherProject = await request(app.getHttpServer())
				.post('/api/projects')
				.set(authHeader(otherToken))
				.send({ name: 'Other User Project' })
				.expect(201);

			// Primary user tries to read it
			await request(app.getHttpServer())
				.get(`/api/projects/${otherProject.body.id}`)
				.set(authHeader(token))
				.expect(403);
		});

		it('returns 403 when updating another user\'s task', async () => {
			const otherToken = await registerAndLogin(app, 'e2e-other2@example.com');

			const otherProject = await request(app.getHttpServer())
				.post('/api/projects')
				.set(authHeader(otherToken))
				.send({ name: 'Other Project 2' })
				.expect(201);

			const otherTask = await request(app.getHttpServer())
				.post(`/api/projects/${otherProject.body.id}/tasks`)
				.set(authHeader(otherToken))
				.send({ title: 'Other Task', due_date: futureDate() })
				.expect(201);

			await request(app.getHttpServer())
				.put(`/api/tasks/${otherTask.body.id}`)
				.set(authHeader(token))
				.send({ title: 'Hijacked' })
				.expect(403);
		});

		it('rejects register with an email that already exists (409)', async () => {
			await request(app.getHttpServer())
				.post('/api/auth/register')
				.send({ name: 'Dup', email: PRIMARY_EMAIL, password: 'Password123!' })
				.expect(409);
		});

		it('rejects login with wrong password (401)', async () => {
			await request(app.getHttpServer())
				.post('/api/auth/login')
				.send({ email: PRIMARY_EMAIL, password: 'WrongPassword!' })
				.expect(401);
		});

		it('rejects login for a non-existent email (401)', async () => {
			await request(app.getHttpServer())
				.post('/api/auth/login')
				.send({ email: 'nobody@example.com', password: 'Password123!' })
				.expect(401);
		});
	});

	// ══════════════════════════════════════════════════════════════════════════
	// Input validation
	// ══════════════════════════════════════════════════════════════════════════
	describe('Input validation', () => {
		it('rejects creating a project without a name (400)', async () => {
			await request(app.getHttpServer())
				.post('/api/projects')
				.set(authHeader(token))
				.send({ description: 'No name' })
				.expect(400);
		});

		it('rejects creating a task without a title (400)', async () => {
			const p = await request(app.getHttpServer())
				.post('/api/projects')
				.set(authHeader(token))
				.send({ name: 'Validation Project' })
				.expect(201);

			await request(app.getHttpServer())
				.post(`/api/projects/${p.body.id}/tasks`)
				.set(authHeader(token))
				.send({ description: 'No title', due_date: futureDate() })
				.expect(400);
		});

		it('rejects an invalid task status value (400)', async () => {
			const p = await request(app.getHttpServer())
				.post('/api/projects')
				.set(authHeader(token))
				.send({ name: 'Status Project' })
				.expect(201);

			await request(app.getHttpServer())
				.post(`/api/projects/${p.body.id}/tasks`)
				.set(authHeader(token))
				.send({ title: 'Bad Status Task', status: 'invalid_status' })
				.expect(400);
		});

		it('returns 404 for a non-existent task ID', async () => {
			await request(app.getHttpServer())
				.get('/api/tasks/00000000-0000-0000-0000-000000000000')
				.set(authHeader(token))
				.expect(404);
		});
	});
});
