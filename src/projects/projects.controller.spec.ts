import { Test } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
	let controller: ProjectsController;
	let projectsService: jest.Mocked<Pick<ProjectsService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>>;

	beforeEach(async () => {
		projectsService = {
			create: jest.fn(),
			findAll: jest.fn(),
			findOne: jest.fn(),
			update: jest.fn(),
			remove: jest.fn(),
		};

		const moduleRef = await Test.createTestingModule({
			controllers: [ProjectsController],
			providers: [{ provide: ProjectsService, useValue: projectsService }],
		}).compile();

		controller = moduleRef.get(ProjectsController);
	});

	it('delegates create to service', async () => {
		projectsService.create.mockResolvedValue({
			id: 'project-1',
			name: 'Backend Internship',
			description: 'REST API project',
			created_at: new Date('2026-07-23T00:00:00.000Z'),
		});

		await expect(
			controller.create('user-1', {
				name: 'Backend Internship',
				description: 'REST API project',
			}),
		).resolves.toEqual({
			id: 'project-1',
			name: 'Backend Internship',
			description: 'REST API project',
			created_at: new Date('2026-07-23T00:00:00.000Z'),
		});

		expect(projectsService.create).toHaveBeenCalledWith('user-1', {
			name: 'Backend Internship',
			description: 'REST API project',
		});
	});

	it('delegates list to service', async () => {
		projectsService.findAll.mockResolvedValue({
			data: [{ id: 'project-1', name: 'Backend Internship' }],
			pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
		});

		await expect(controller.getProjects('user-1', { page: 1, limit: 10 })).resolves.toEqual({
			data: [{ id: 'project-1', name: 'Backend Internship' }],
			pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
		});
	});

	it('delegates find one to service', async () => {
		projectsService.findOne.mockResolvedValue({
			id: 'project-1',
			name: 'Backend Internship',
			description: 'REST API project',
			created_at: new Date('2026-07-23T00:00:00.000Z'),
		});

		await expect(controller.getProject('user-1', 'project-1')).resolves.toEqual({
			id: 'project-1',
			name: 'Backend Internship',
			description: 'REST API project',
			created_at: new Date('2026-07-23T00:00:00.000Z'),
		});
	});

	it('delegates update to service', async () => {
		projectsService.update.mockResolvedValue({
			id: 'project-1',
			name: 'Updated Name',
			description: 'Updated Description',
			created_at: new Date('2026-07-23T00:00:00.000Z'),
		});

		await expect(
			controller.update('user-1', 'project-1', {
				name: 'Updated Name',
				description: 'Updated Description',
			}),
		).resolves.toEqual({
			id: 'project-1',
			name: 'Updated Name',
			description: 'Updated Description',
			created_at: new Date('2026-07-23T00:00:00.000Z'),
		});
	});

	it('delegates remove to service', async () => {
		projectsService.remove.mockResolvedValue({ message: 'Project deleted successfully.' });

		await expect(controller.remove('user-1', 'project-1')).resolves.toEqual({ message: 'Project deleted successfully.' });
	});
});