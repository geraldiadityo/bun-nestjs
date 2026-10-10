import { Injectable, Logger } from "@nestjs/common";
import { DocumentCounterRepository } from "./document-counter.repository";
import { DocumentType } from "./document-counter.model";
import { format } from 'date-fns';
import { Prisma } from "@prisma/client";

@Injectable()
export class DocumentCounterService {
    private readonly logger = new Logger("DocumentCounterService")
    
    constructor(
        private repo: DocumentCounterRepository,
    ) {}

    private getPrefix(
        documentType: DocumentType
    ): string {
        const mapping: Record<DocumentType, string> = {
            PEGAWAI: 'NK',
        };
        return mapping[documentType];
    }

    private format(
        documentType: DocumentType,
        date: Date,
        sequence: number
    ): string {
        const prefix = this.getPrefix(documentType);
        const formatDate = format(date, 'yyyyMMdd');

        return `${prefix}-${formatDate}-${String(sequence).padStart(3, '0')}`
    }

    async generate(
        tx: Prisma.TransactionClient,
        documentType: DocumentType,
        date: Date = new Date(),
    ): Promise<string> {
        this.logger.log(`starting create new sequence number for document type: ${documentType}`);
        const normalizeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const sequence = await this.repo.nextSequence(tx, documentType, normalizeDate);

        return this.format(documentType, normalizeDate, sequence);
    }
}