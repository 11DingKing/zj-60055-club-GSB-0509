import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CheckInWithCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  checkInCode: string;
}
