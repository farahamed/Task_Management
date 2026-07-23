import { Test } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
	let controller: TasksController;
	let tasksService: jest.Mocked<Pick<TasksService, 'create'>>;

	beforeEach(async () => {
		tasksService = {
			create: jest.fn(),
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
});