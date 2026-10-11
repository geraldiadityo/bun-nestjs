import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { Pengguna, Prisma } from "@prisma/client";
import { PenggunaCreateDTO } from "./pengguna.model";

type FindManyArgs = Parameters<PrismaService['pengguna']['findMany']>[0];
type FindAllArgs = {
    where?: Prisma.PenggunaWhereInput;
    orderBy?: Prisma.PenggunaOrderByWithRelationInput;
    take?: number;
    skip?: number;
}
@Injectable()
export class PenggunaRepository {
    constructor(
        private prisma: PrismaService
    ) {}

    async findMany(
        args: FindManyArgs
    ): Promise<Pengguna[]> {
        return await this.prisma.pengguna.findMany({
            ...args,
            include: {
                pegawai: true,
                role: true
            }
        })
    }

    async findAll(
        args: FindAllArgs
    ): Promise<Pengguna[]> {
        return await this.findMany(args);
    }

    async countAll(where?: Prisma.PenggunaWhereInput): Promise<number> {
        return await this.prisma.pengguna.count({where})
    }

    async findById(
        id: number,
        tx?: Prisma.TransactionClient
    ): Promise<Pengguna | null> {
        const client = tx || this.prisma;
        return await client.pengguna.findUnique({
            where: { id: id },
            include: {
                pegawai: true,
                role: true
            }
        })
    }
    
    async findByUsername(
        username: string,
        tx?: Prisma.TransactionClient
    ): Promise<Pengguna | null> {
        const client = tx || this.prisma;
        return await client.pengguna.findUnique({
            where: { username: username },
            include: {
                pegawai: true,
                role: true
            }
        })
    }

    async create(
        data: PenggunaCreateDTO,
        tx?: Prisma.TransactionClient
    ): Promise<Pengguna> {
        const client = tx || this.prisma;
        return await client.pengguna.create({
            data: data,
            include: {
                pegawai: true,
                role: true
            }
        })
    }

    async update(
        id: number,
        data: Partial<Pengguna>,
        tx?: Prisma.TransactionClient
    ): Promise<Pengguna> {
        const client = tx || this.prisma;
        return await client.pengguna.update({
            where: { id: id },
            data: data,
            include: {
                pegawai: true,
                role: true
            }
        })
    }

    async remove(
        id: number,
        tx?: Prisma.TransactionClient
    ): Promise<Pengguna> {
        const client = tx || this.prisma;
        return await client.pengguna.delete({
            where: { id: id },
            include: {
                pegawai: true,
                role: true
            }
        })
    }
}