import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
	constructor(private readonly projectsService: ProjectsService) {}

	@Post()
	@ApiOperation({ summary: 'Create project', description: 'Creates a new project for the authenticated user.' })
	@ApiBody({ type: CreateProjectDto })
	@ApiCreatedResponse({ type: ProjectResponseDto, description: 'Project created successfully.' })
	@ApiBadRequestResponse({ description: 'Validation failed.' })
	@ApiConflictResponse({ description: 'Project already exists.' })
	create(@CurrentUser('sub') userId: string, @Body() dto: CreateProjectDto) {
		return this.projectsService.create(userId, dto);
	}

	@Get()
	@ApiOperation({ summary: 'Get projects', description: 'Returns the authenticated user non-deleted projects with pagination.' })
	@ApiQuery({ name: 'page', required: false, example: 1 })
	@ApiQuery({ name: 'limit', required: false, example: 10 })
	@ApiOkResponse({
		schema: {
			example: {
				data: [
					{
						id: 'uuid',
						name: 'Backend Internship',
					},
				],
				pagination: {
					page: 1,
					limit: 10,
					total: 20,
					totalPages: 2,
				},
			},
		},
	})
	getProjects(@CurrentUser('sub') userId: string, @Query() query: PaginationQueryDto) {
		return this.projectsService.findAll(userId, query);
	}
}