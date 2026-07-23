import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaskSummaryDto {
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
}