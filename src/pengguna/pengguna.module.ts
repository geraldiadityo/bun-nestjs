import { Module } from "@nestjs/common";
import { DocumentCounterModule } from "../document-counter/document-counter.module";
import { PegawaiRepository } from "./pegawai/pegawai.repository";
import { PegawaiService } from "./pegawai/pegawai.service";
import { PegawaiController } from "./pegawai/pegawai.controller";
import { RoleRepository } from "./role/role.repository";
import { RoleService } from "./role/role.service";
import { RoleController } from "./role/role.controller";
import { PenggunaService } from "./pengguna/pengguna.service";
import { PenggunaRepository } from "./pengguna/pengguna.repository";
import { PenggunaController } from "./pengguna/pengguna.controller";

@Module({
    imports: [
        DocumentCounterModule
    ],
    providers: [
        PegawaiRepository,
        PegawaiService,

        RoleRepository,
        RoleService,

        PenggunaRepository,
        PenggunaService,
    ],
    controllers: [
        PegawaiController,
        RoleController,
        PenggunaController,
    ],
    exports: [
        PegawaiService,
        RoleService,
        PenggunaService
    ]
})
export class PenggunaModule {}