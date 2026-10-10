import { Module } from "@nestjs/common";
import { DocumentCounterRepository } from "./document-counter.repository";
import { DocumentCounterService } from "./document-counter.service";

@Module({
    providers: [
        DocumentCounterRepository,
        DocumentCounterService,
    ],
    exports: [
        DocumentCounterService
    ]
})
export class DocumentCounterModule {}