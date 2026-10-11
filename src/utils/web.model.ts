import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class QueryStandart {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;
    
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize: number = 10;

    @IsOptional()
    @IsString()
    keyword?: string
}

export class ApiResponse<T> {
    data: T;
    message?: string;
    totalItem?: number;
    totalPage?: number;
    currentPage?: number;
    token?: string;
    refresh_token?: string;
}