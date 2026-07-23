import { Test } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
	let controller: TasksController;
	let tasksService: jest.Mocked<Pick<TasksService, 'create' | 'findByProject' | 'findOne'>>;

	beforeEach(async () => {
		tasksService = {
			create: jest.fn(),
			findByProject: jest.fn(),
			findOne: jest.fn(),
		};

		const moduleRef = await Test.createTestingModule({
			controllers: [TasksController],
			providers: [{ provide: TasksService, useValue: tasksService }],
		}).compile();

		controller = moduleRef.get(TasksController);
	});

	it('delegates create to service', async () => {
		tasksService.create.mockResolvedValue({
			id: 'task-1',
			title: 'Implement JWT',
			status: 'todo',
			priority: 'high',
		});

		await expect(
			controller.create('user-1', 'project-1', {
				title: 'Implement JWT',
				description: 'Use Passport JWT',
				priority: 'high' as never,
				status: 'todo' as never,
				due_date: new Date('2026-08-01'),
			}),
		).resolves.toEqual({
			id: 'task-1',
			title: 'Implement JWT',
			status: 'todo',
			priority: 'high',
		});
	});

	it('delegates project task listing to service', async () => {
		tasksService.findByProject.mockResolvedValue({
			data: [{ id: 'task-1', title: 'Implement JWT', status: 'todo', priority: 'high' }],
			pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
		});

		await expect(
			controller.getProjectTasks('user-1', 'project-1', {
				page: 1,
				limit: 10,
				status: 'todo' as never,
				priority: 'high' as never,
				due_date_from: undefined,
				due_date_to: undefined,
				sort: 'created_at' as never,
				order: 'desc' as never,
			}),
		).resolves.toEqual({
			data: [{ id: 'task-1', title: 'Implement JWT', status: 'todo', priority: 'high' }],
			pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
		});
	});

	it('delegates single task retrieval to service', async () => {
		tasksService.findOne.mockResolvedValue({
			id: 'task-1',
			title: 'Implement JWT',
			description: 'Use Passport JWT',
			status: 'todo',
			priority: 'high',
			due_date: new Date('2026-08-01'),
			project: { id: 'project-1', name: 'Backend Internship' },
		});

		await expect(controller.getTask('user-1', 'task-1')).resolves.toEqual({
			id: 'task-1',
			title: 'Implement JWT',
			description: 'Use Passport JWT',
			status: 'todo',
			priority: 'high',
			due_date: new Date('2026-08-01'),
			project: { id: 'project-1', name: 'Backend Internship' },
		});
	});
});