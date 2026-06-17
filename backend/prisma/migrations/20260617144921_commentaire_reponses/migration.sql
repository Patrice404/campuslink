-- AlterTable
ALTER TABLE "Commentaire" ADD COLUMN     "id_parent" BIGINT;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_id_parent_fkey" FOREIGN KEY ("id_parent") REFERENCES "Commentaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
