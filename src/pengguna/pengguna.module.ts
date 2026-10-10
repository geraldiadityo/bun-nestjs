import { Module } from "@nestjs/common";
import { DocumentCounterModule } from "../document-counter/document-counter.module";
import { PegawaiRepository } from "./pegawai/pegawai.repository";
import { PegawaiService } from "./pegawai/pegawai.service";
import { PegawaiController } from "./pegawai/pegawai.controller";
import { RoleRepository } from "./role/role.repository";
import { RoleService } from "./role/role.service";
import { RoleController } from "./role/role.controller";

@Module({
    imports: [
        DocumentCounterModule
    ],
    providers: [
        PegawaiRepository,
        PegawaiService,

        RoleRepository,
        RoleService
    ],
    controllers: [
        PegawaiController,
        RoleController
    ],
    exports: [
        PegawaiService,
        RoleService
    ]
})
export class PenggunaModule {}