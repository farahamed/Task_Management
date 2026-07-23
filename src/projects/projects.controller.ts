import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { DeleteProjectResponseDto } from './dto/delete-project-response.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectsPaginationResponseDto } from './dto/projects-pagination.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
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
	@ApiOkResponse({ type: ProjectsPaginationResponseDto, description: 'Projects retrieved successfully.' })
	getProjects(@CurrentUser('sub') userId: string, @Query() query: PaginationQueryDto) {
		return this.projectsService.findAll(userId, query);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get project', description: 'Returns a single non-deleted project owned by the authenticated user.' })
	@ApiParam({ name: 'id', example: 'uuid' })
	@ApiOkResponse({ type: ProjectResponseDto, description: 'Project retrieved successfully.' })
	@ApiBadRequestResponse({ description: 'Validation failed.' })
	@ApiNotFoundResponse({ description: 'Project not found.' })
	@ApiForbiddenResponse({ description: 'Project belongs to another user.' })
	getProject(@CurrentUser('sub') userId: string, @Param('id') id: string) {
		return this.projectsService.findOne(userId, id);
	}

	@Put(':id')
	@ApiOperation({ summary: 'Update project', description: 'Updates an existing project owned by the authenticated user.' })
	@ApiParam({ name: 'id', example: 'uuid' })
	@ApiBody({ type: UpdateProjectDto })
	@ApiOkResponse({ type: ProjectResponseDto, description: 'Project updated successfully.' })
	@ApiBadRequestResponse({ description: 'Validation failed.' })
	@ApiNotFoundResponse({ description: 'Project not found.' })
	@ApiForbiddenResponse({ description: 'Project belongs to another user.' })
	update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
		return this.projectsService.update(userId, id, dto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete project', description: 'Soft deletes a project and all related tasks.' })
	@ApiParam({ name: 'id', example: 'uuid' })
	@ApiOkResponse({ type: DeleteProjectResponseDto, description: 'Project deleted successfully.' })
	@ApiBadRequestResponse({ description: 'Validation failed.' })
	@ApiNotFoundResponse({ description: 'Project not found.' })
	@ApiForbiddenResponse({ description: 'Project belongs to another user.' })
	remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
		return this.projectsService.remove(userId, id);
	}
}