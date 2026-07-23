import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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
}