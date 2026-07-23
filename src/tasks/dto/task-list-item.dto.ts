import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskProjectResponseDto } from './task-project-response.dto';

export class TaskListItemDto {
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
  due_date?: string | null;

  @ApiProperty({ type: () => TaskProjectResponseDto })
  project!: TaskProjectResponseDto;
}