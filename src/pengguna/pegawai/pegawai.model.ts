import { Type } from "class-transformer";
import {IsInt, IsOptional, IsString, Max, Min } from "class-validator";
export class PegawaiQueryOptions {
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
    keyword?: string;
}

export class PegawaiRequestDTO {
    nama: string;
}

export class PegawaiCreateDTO {
    nk: string;
    nama: string;
}

export class PegawaiResponse {
    id: number;
    nk: string;
    nama: string;
}