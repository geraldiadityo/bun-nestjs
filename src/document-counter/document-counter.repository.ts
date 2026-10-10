import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { DocumentType } from "./document-counter.model";

@Injectable()
export class DocumentCounterRepository {
    async nextSequence(
        tx: Prisma.TransactionClient,
        documentType: DocumentType,
        date: Date
    ): Promise<number> {
        const result = await tx.$queryRaw<
        { last_number: number }[]
        >`
            INSERT INTO document_counter(document_type, date, last_number)
            VALUES(${documentType}, ${date}::date, 1)
            ON CONFLICT (document_type, date)
            DO UPDATE SET last_number = document_counter.last_number + 1
            RETURNING last_number
        `;

        return result[0].last_number;
    }
}