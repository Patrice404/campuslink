-- CreateTable
CREATE TABLE "_FormationToMatiere" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL,

    CONSTRAINT "_FormationToMatiere_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FormationToMatiere_B_index" ON "_FormationToMatiere"("B");

-- AddForeignKey
ALTER TABLE "_FormationToMatiere" ADD CONSTRAINT "_FormationToMatiere_A_fkey" FOREIGN KEY ("A") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FormationToMatiere" ADD CONSTRAINT "_FormationToMatiere_B_fkey" FOREIGN KEY ("B") REFERENCES "Matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;
