import { Module } from "@nestjs/common";
import { DocumentCounterModule } from "../document-counter/document-counter.module";
import { PegawaiRepository } from "./pegawai/pegawai.repository";
import { PegawaiService } from "./pegawai/pegawai.service";
import { PegawaiController } from "./pegawai/pegawai.controller";

@Module({
    imports: [
        DocumentCounterModule
    ],
    providers: [
        PegawaiRepository,
        PegawaiService
    ],
    controllers: [
        PegawaiController
    ],
    exports: [
        PegawaiService
    ]
})
export class PenggunaModule {}