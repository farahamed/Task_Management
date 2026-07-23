import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectSummaryDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Backend Internship' })
  name!: string;
}

export class TaskResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Implement JWT' })
  title!: string;

  @ApiPropertyOptional({ example: 'Use Passport JWT strategy' })
  description?: string | null;

  @ApiProperty({ example: 'todo' })
  status!: string;

  @ApiProperty({ example: 'high' })
  priority!: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  due_date?: Date | null;

  @ApiProperty({ type: () => ProjectSummaryDto })
  project!: ProjectSummaryDto;
}

export class TaskWithoutProjectDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Implement JWT' })
  title!: string;

  @ApiPropertyOptional({ example: 'Use Passport JWT strategy' })
  description?: string | null;

  @ApiProperty({ example: 'todo' })
  status!: string;

  @ApiProperty({ example: 'high' })
  priority!: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  due_date?: Date | null;
}

export class CreateTaskResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Implement JWT' })
  title!: string;

  @ApiProperty({ example: 'todo' })
  status!: string;

  @ApiProperty({ example: 'high' })
  priority!: string;
}